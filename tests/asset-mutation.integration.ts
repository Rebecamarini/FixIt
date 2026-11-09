import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { cadastrarBem } from '../src/server/assets.ts';
import { obterBemParaEdicao, alterarBem } from '../src/server/asset-mutation.ts';
import { createRequestClient } from '../src/server/identity.ts';
import { localAdmin, cookieJar, uniqueSignup, createRoleUser } from './support/identity.ts';

const valid = { descricao: 'Cadeira', localizacao: 'Sala 12', estado_conservacao: 'Bom', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' };

function audit(id: string) {
  const output = execFileSync('docker', ['exec', 'supabase_db_fixit', 'psql', '-U', 'postgres', '-At', '-c',
    `select coalesce(jsonb_agg(to_jsonb(a) order by ocorrido_em),'[]') from private.bens_alteracoes a where bem_id = '${id}'::uuid`], { encoding: 'utf8' });
  return JSON.parse(output) as { autor_id: string; ocorrido_em: string; antes: Record<string, unknown>; depois: Record<string, unknown> }[];
}

test('Gestor edita os dados mantendo identidade e recupera a confirmação original do cadastro', async () => {
  const admin = localAdmin();
  const signup = uniqueSignup();
  const user = await createRoleUser(admin, signup, 'Gestor');
  const id = user.data.user!.id;
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
  try {
    const tentativaCadastro = crypto.randomUUID();
    const initial = await cadastrarBem(client, valid, tentativaCadastro, id);
    assert.ok(initial.confirmation);
    const read = await obterBemParaEdicao(client, initial.confirmation.id);
    assert.equal(read.erro, null);
    assert.equal(read.data?.versao, 1);
    const result = await alterarBem(client, { id: initial.confirmation.id, versao: 1, acao: 'editar', dados: { ...valid, descricao: ' Mesa ', marca: ' Marca ', data_aquisicao: '2024-01-01', garantia_ate: '2024-01-02' }, tentativa: crypto.randomUUID(), identidade: id });
    assert.equal(result.status, 'salvo', result.message);
    assert.equal(result.bem?.descricao, 'Mesa');
    assert.equal(result.bem?.versao, 2);
    assert.equal(result.bem?.codigo, initial.confirmation.codigo);
    assert.equal((await obterBemParaEdicao(client, initial.confirmation.id)).data?.descricao, 'Mesa');
    assert.deepEqual((await cadastrarBem(client, valid, tentativaCadastro, id)).confirmation, { ...initial.confirmation, repetida: true });
  } finally {
    await admin.from('bens_patrimoniais').delete().eq('autor_id', id);
    await admin.auth.admin.deleteUser(id);
  }
});

test('conflitos impedem sobrescrita e arquivamento desatualizado; reenvio preserva mudanças posteriores', async () => {
  const admin = localAdmin();
  const users: { id: string; client: ReturnType<typeof createRequestClient> }[] = [];
  try {
    for (let i = 0; i < 2; i++) {
      const signup = uniqueSignup();
      const user = await createRoleUser(admin, signup, 'Gestor');
      const client = createRequestClient(cookieJar());
      await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
      users.push({ id: user.data.user!.id, client });
    }
    const [a,b] = users;
    const creationAttempt = crypto.randomUUID();
    const first = (await cadastrarBem(a.client, valid, creationAttempt, a.id)).confirmation!;
    const attempt = crypto.randomUUID();
    const input = { id: first.id, versao: 1, acao: 'editar' as const, dados: { ...valid, descricao: 'Editada A' }, tentativa: attempt, identidade: a.id };
    const concurrent = await Promise.all([alterarBem(a.client, input), alterarBem(a.client,input)]);
    assert.equal(concurrent.filter(r => r.repetida === false).length,1);
    assert.equal(concurrent.filter(r => r.repetida === true).length,1);
    const stale = await alterarBem(b.client, { ...input, identidade: b.id, tentativa: crypto.randomUUID(), dados: { ...valid, descricao: 'Não gravar' } });
    assert.equal(stale.status, 'conflito');
    assert.equal(stale.bem?.descricao, 'Editada A');
    const staleArchive = await alterarBem(b.client, { ...input, identidade:b.id, tentativa:crypto.randomUUID(), acao:'arquivar', dados:undefined });
    assert.equal(staleArchive.status, 'conflito');
    const later = await alterarBem(b.client, { ...input, versao:2, identidade:b.id, tentativa:crypto.randomUUID(), dados:{ ...valid, descricao:'Editada B' } });
    assert.equal(later.status,'salvo');
    const replay = await alterarBem(a.client,input);
    assert.equal(replay.status,'salvo');
    assert.equal(replay.bem?.descricao,'Editada A');
    assert.equal(replay.repetida,true);
    assert.equal((await obterBemParaEdicao(a.client,first.id)).data?.descricao,'Editada B');
    const noChange = await alterarBem(b.client,{...input,versao:3,identidade:b.id,tentativa:crypto.randomUUID(),dados:{...valid,descricao:' Editada B ',marca:'  '}});
    assert.equal(noChange.status,'sem_alteracoes');
    assert.equal(noChange.bem?.versao,3);
    const archiveInput = {...input,versao:3,acao:'arquivar' as const,dados:undefined,tentativa:crypto.randomUUID(),identidade:b.id};
    const archive = await alterarBem(b.client,archiveInput);
    assert.equal(archive.status,'arquivado');
    assert.equal(archive.bem?.versao,4);
    assert.equal((await alterarBem(b.client,archiveInput)).repetida,true);
    assert.equal((await alterarBem(a.client,{...input,versao:3,tentativa:crypto.randomUUID()})).status,'ja_arquivado');
    assert.equal((await alterarBem(a.client,{...archiveInput,identidade:a.id,tentativa:crypto.randomUUID()})).status,'ja_arquivado');
    assert.equal((await obterBemParaEdicao(a.client,first.id)).erro,'nao_encontrado');
    assert.deepEqual((await cadastrarBem(a.client,valid,creationAttempt,a.id)).confirmation,{...first,repetida:true});
    const saved = await admin.from('bens_patrimoniais').select('*').eq('id',first.id).single();
    assert.equal(saved.data!.ativo,false);
    assert.equal(saved.data!.autor_id,a.id);
    assert.equal(saved.data!.codigo,first.codigo);
    const events = audit(first.id);
    assert.equal(events.length,3);
    assert.deepEqual(events.map(e=>e.autor_id),[a.id,b.id,b.id]);
    assert.equal(events[0].antes.descricao,'Cadeira');
    assert.equal(events[0].depois.descricao,'Editada A');
    assert.equal(events[2].antes.ativo,true);
    assert.equal(events[2].depois.ativo,false);
    assert.ok(events.every(e=>!Number.isNaN(Date.parse(e.ocorrido_em))));
  } finally {
    await admin.from('bens_patrimoniais').delete().in('autor_id',users.map(u=>u.id));
    for(const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});

test('edição e arquivamento exigem Gestor ativo inclusive nas chamadas diretas, conflitos e reenvios', async () => {
  const admin = localAdmin();
  const users: { id: string; client: ReturnType<typeof createRequestClient> }[] = [];
  try {
    for (const role of ['Gestor','Gestor','Cliente','Manutentor']) {
      const signup = uniqueSignup();
      const user = await createRoleUser(admin,signup,role);
      const client = createRequestClient(cookieJar());
      await client.auth.signInWithPassword({email:signup.email,password:signup.password});
      users.push({id:user.data.user!.id,client});
    }
    const [owner,other,...denied] = users;
    const first = (await cadastrarBem(owner.client,valid,crypto.randomUUID(),owner.id)).confirmation!;
    const input = {id:first.id,versao:1,acao:'editar' as const,dados:{...valid,descricao:'Mudança'},tentativa:crypto.randomUUID(),identidade:owner.id};
    assert.equal((await alterarBem(owner.client,input)).status,'salvo');
    assert.equal((await alterarBem(other.client,{...input,identidade:other.id})).denied,true);
    assert.equal((await alterarBem(owner.client,{...input,identidade:other.id})).denied,true);
    for (const u of [...denied,{id:owner.id,client:createRequestClient(cookieJar())}]) {
      assert.equal((await obterBemParaEdicao(u.client,first.id)).data,null);
      assert.equal((await alterarBem(u.client,{...input,identidade:u.id})).denied,true);
      for (const acao of ['editar','arquivar']) {
        const direct = await u.client.rpc('us027_alterar_bem',{alvo:first.id,versao_esperada:2,acao,dados:acao==='editar'?valid:null,tentativa:crypto.randomUUID(),identidade:u.id});
        assert.ok(direct.error);
      }
    }
    for(const u of users) {
      assert.ok((await u.client.from('bens_patrimoniais').update({descricao:'Forjada',versao:50}).eq('id',first.id)).error);
      assert.ok((await u.client.from('bens_patrimoniais').update({ativo:false}).eq('id',first.id)).error);
      assert.ok((await u.client.from('bens_patrimoniais').delete().eq('id',first.id)).error);
      assert.ok((await u.client.schema('private').from('bens_alteracoes').select('*')).error);
      assert.ok((await u.client.schema('private').from('bens_alteracoes').insert({bem_id:first.id})).error);
    }
    await admin.from('perfis').update({provisionamento_pendente:true}).eq('id',owner.id);
    assert.equal((await alterarBem(owner.client,input)).denied,true);
    assert.equal((await obterBemParaEdicao(owner.client,first.id)).data,null);
    assert.equal((await owner.client.rpc('us027_alterar_bem',{alvo:first.id,versao_esperada:1,acao:'editar',dados:valid,tentativa:input.tentativa,identidade:owner.id})).error?.code,'42501');
    await admin.from('perfis').update({provisionamento_pendente:false}).eq('id',owner.id);
    await admin.rpc('us004_excluir_conta',{alvo:owner.id,autor:other.id});
    assert.equal((await alterarBem(owner.client,input)).denied,true);
    assert.equal((await owner.client.rpc('us027_alterar_bem',{alvo:first.id,versao_esperada:1,acao:'editar',dados:valid,tentativa:input.tentativa,identidade:owner.id})).error?.code,'42501');
    assert.equal(audit(first.id).length,1);
  } finally {
    const ids=users.map(u=>u.id);
    await admin.from('bens_patrimoniais').delete().in('autor_id',ids);
    await admin.from('exclusoes_contas').delete().in('conta_id',ids);
    for(const u of users) await admin.auth.admin.deleteUser(u.id);
  }
});

test('edição valida os sete campos e datas no módulo público e no banco sem alterar valores inválidos', async () => {
  const admin = localAdmin();
  const signup=uniqueSignup();
  const user=await createRoleUser(admin,signup,'Gestor');
  const id=user.data.user!.id;
  const client=createRequestClient(cookieJar());
  await client.auth.signInWithPassword({email:signup.email,password:signup.password});
  try {
    const first=(await cadastrarBem(client,valid,crypto.randomUUID(),id)).confirmation!;
    const invalids=[{descricao:'  '},{localizacao:'\t\n'},{estado_conservacao:'Inválido'},{descricao:'d'.repeat(501)},
      {localizacao:'l'.repeat(201)},{marca:'m'.repeat(101)},{modelo:'m'.repeat(101)},
      {data_aquisicao:'9999-01-01'},{data_aquisicao:'2025-02-29'},{garantia_ate:'2026-02-30'},
      {data_aquisicao:'2024-06-01',garantia_ate:'2024-05-31'},{garantia_ate:'0000-01-01'},{garantia_ate:'infinity'}];
    for (const patch of invalids) {
      const dados={...valid,...patch};
      const result=await alterarBem(client,{id:first.id,versao:1,acao:'editar',dados,tentativa:crypto.randomUUID(),identidade:id});
      assert.ok(result.errors,JSON.stringify(patch));
      assert.ok((await client.rpc('us027_alterar_bem',{alvo:first.id,versao_esperada:1,acao:'editar',dados,tentativa:crypto.randomUUID(),identidade:id})).error,JSON.stringify(patch));
    }
    for (const key of ['codigo','numero','autor_id','ativo','tentativa_id','criado_em','versao']) {
      const dados={...valid,[key]:'forjado'};
      assert.equal((await alterarBem(client,{id:first.id,versao:1,acao:'editar',dados,tentativa:crypto.randomUUID(),identidade:id})).status,undefined);
      assert.ok((await client.rpc('us027_alterar_bem',{alvo:first.id,versao_esperada:1,acao:'editar',dados,tentativa:crypto.randomUUID(),identidade:id})).error);
    }
    assert.equal((await obterBemParaEdicao(client,first.id)).data?.versao,1);
    assert.equal(audit(first.id).length,0);
    let version=1;
    for(const state of ['Novo','Bom','Regular','Ruim','Péssimo']) {
      const result=await alterarBem(client,{id:first.id,versao:version,acao:'editar',dados:{...valid,estado_conservacao:state,garantia_ate:'2020-01-01'},tentativa:crypto.randomUUID(),identidade:id});
      assert.equal(result.status,'salvo');
      assert.equal(result.bem?.estado_conservacao,state);
      assert.equal(result.bem?.data_aquisicao,null);
      version=result.bem!.versao;
    }
    const complete=await alterarBem(client,{id:first.id,versao:version,acao:'editar',dados:{...valid,descricao:'d'.repeat(500),localizacao:'l'.repeat(200),marca:'m'.repeat(100),modelo:'m'.repeat(100),data_aquisicao:'2024-02-29',garantia_ate:'2024-02-29'},tentativa:crypto.randomUUID(),identidade:id});
    assert.equal(complete.status,'salvo');
    const clear=await alterarBem(client,{id:first.id,versao:complete.bem!.versao,acao:'editar',dados:valid,tentativa:crypto.randomUUID(),identidade:id});
    assert.equal(clear.status,'salvo');
    assert.equal(clear.bem?.marca,null);
    assert.equal(clear.bem?.data_aquisicao,null);
    const archives=await Promise.all(Array.from({length:3},()=>alterarBem(client,{id:first.id,versao:clear.bem!.versao,acao:'arquivar',tentativa:crypto.randomUUID(),identidade:id})));
    assert.equal(archives.filter(r=>r.status==='arquivado').length,1);
    assert.equal(archives.filter(r=>r.status==='ja_arquivado').length,2);
  } finally {
    await admin.from('bens_patrimoniais').delete().eq('autor_id',id);
    await admin.auth.admin.deleteUser(id);
  }
});
