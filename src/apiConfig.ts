/**
 * CONFIGURAÇÃO GLOBAL DA API (SegundaChance Angola)
 * 
 * Permite que a aplicação React saiba onde se encontra o backend Spring Boot,
 * seja em ambiente local de desenvolvimento ou numa infraestrutura na cloud.
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Garante que o URL possui um protocolo válido (http/https),
 * corrigindo endereços como 'localhost:2045' ou 'meu-backend.com'
 */
const formatUrlWithProtocol = (url: string | undefined): string => {
  if (!url) return '';
  
  // Se já tem protocolo ou for caminho relativo, retorna tal como está
  if (
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('ws://') || 
    url.startsWith('wss://') || 
    url.startsWith('//') ||
    url.startsWith('/')
  ) {
    return url;
  }
  
  // Deteta o protocolo da página atual para manter a segurança (HTTP ou HTTPS)
  const protocol = window.location.protocol; // Ex: 'http:' ou 'https:'
  const secureProtocol = protocol === 'https:' ? 'https:' : 'http:';
  
  return `${secureProtocol}//${url}`;
};

// URL Base da API REST
const rawApiUrl = (import.meta as any).env.VITE_API_URL || (isLocal ? 'http://localhost:8080' : '');
export const API_BASE_URL = formatUrlWithProtocol(rawApiUrl);

// URL Base do WebSocket STOMP
const rawWsUrl = (import.meta as any).env.VITE_WS_URL || (isLocal ? 'http://localhost:8080/ws' : '/ws');
export const WS_BASE_URL = formatUrlWithProtocol(rawWsUrl);

/**
 * Constrói o URL absoluto ou relativo correto para fazer fetch na API.
 * Garante compatibilidade total seja qual for o domínio do backend.
 * 
 * Exemplo: getApiUrl('/api/listings') -> 'http://localhost:8080/api/listings'
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Se o caminho já for um URL completo (ex: http:// ou https://), retorna-o intacto
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  
  return `${API_BASE_URL}${cleanPath}`;
};
