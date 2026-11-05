import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui';
export const metadata: Metadata = { title: 'Privacidade da prévia' };
export default function PrivacyPage() {
  return <div className="container page-space narrow prose"><Breadcrumb current="Privacidade" /><span className="eyebrow muted">PRÉVIA DO CATÁLOGO</span><h1>Clareza sobre<br />seus dados.</h1>
    <p className="lead">Esta prévia permite consultar o catálogo. Contas, avaliações e envio de arquivos ainda não estão abertos.</p>
    <h2>Pesquisa e acesso ao site</h2><p>A pesquisa consulta os modelos incluídos no projeto. O texto pesquisado aparece no endereço da página e pode permanecer no histórico do navegador. Evite incluir informações pessoais na busca.</p>
    <p>Na versão hospedada na Vercel, as requisições passam pela infraestrutura de hospedagem e podem gerar registros técnicos de acesso, como endereço IP, horário e página solicitada. Não há ferramenta de publicidade ou análise de visitantes integrada ao Duraverso.</p>
    <h2>Câmera sob seu controle</h2><p>A câmera só é solicitada ao tocar em “Abrir câmera”. A leitura do código acontece no dispositivo; as imagens não são enviadas ao Duraverso. A leitura pode ser encerrada pelo botão da tela.</p>
    <h2>Contas e contribuições desativadas</h2><p>Esta prévia não inicia login com Google, não cria contas e não recebe relatos. Não há banco de proprietários ou avaliações em uso nesta fase.</p>
    <h2>Antes de abrir a participação</h2><p>Este aviso será ampliado com o responsável pelo serviço, o canal de contato, os fornecedores utilizados, os prazos de retenção e o procedimento de exclusão. A abertura das contas dependerá dessa preparação.</p>
  </div>;
}
