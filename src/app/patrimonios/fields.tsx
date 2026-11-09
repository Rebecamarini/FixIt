'use client';
import { camposBem, estadosConservacao, hojeBem, type PreenchimentoBem, type ErrosBem } from '../../lib/asset-form.ts';
import styles from '../solicitacoes/nova/form.module.css';

type Props = { values: PreenchimentoBem; errors?: ErrosBem; change: (field: keyof PreenchimentoBem, value: string) => void };

export function CamposBem(props: Props) {
  return camposBem.map(([field]) => <CampoBem key={field} field={field} {...props} />);
}

function CampoBem({ field, values, errors, change }: Props & { field: keyof PreenchimentoBem }) {
  const [, label, required, ...limits] = camposBem.find(([key]) => key === field)!;
  const error = errors?.[field];
  const props = {
    id: field, name: field, value: values[field], required,
    'aria-invalid': !!error, 'aria-describedby': error ? `${field}-error` : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => change(field, event.target.value),
  };
  return <div>
    <label htmlFor={field}>{label} ({required ? 'obrigatório' : 'opcional'})</label>
    {field === 'estado_conservacao' ? <select {...props}><option value="">Selecione o estado</option>{estadosConservacao.map(value => <option key={value}>{value}</option>)}</select>
      : field === 'descricao' ? <textarea {...props} rows={4} maxLength={limits[0]} />
        : <input {...props} type={field === 'data_aquisicao' || field === 'garantia_ate' ? 'date' : 'text'} maxLength={limits[0]} max={field === 'data_aquisicao' ? hojeBem() : undefined} />}
    {error && <span id={`${field}-error`} className={styles.error}>{error}</span>}
  </div>;
}
