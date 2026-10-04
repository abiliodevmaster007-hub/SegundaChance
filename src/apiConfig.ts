/**
 * CONFIGURAÇÃO GLOBAL DA API (Kuenda / SegundaChance Angola)
 * 
 * Permite que a aplicação React comunique com o servidor full-stack ou com
 * uma instância externa do backend Spring Boot configurada via VITE_API_URL.
 */

const formatUrlWithProtocol = (url: string | undefined): string => {
  if (!url) return '';
  
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
  
  const protocol = window.location.protocol;
  const secureProtocol = protocol === 'https:' ? 'https:' : 'http:';
  
  return `${secureProtocol}//${url}`;
};

// Se VITE_API_URL estiver definido, utiliza-o; caso contrário usa rota relativa (/api/...) no mesmo servidor
const rawApiUrl = (import.meta as any).env?.VITE_API_URL || '';
export const API_BASE_URL = formatUrlWithProtocol(rawApiUrl);

const rawWsUrl = (import.meta as any).env?.VITE_WS_URL || '/ws';
export const WS_BASE_URL = formatUrlWithProtocol(rawWsUrl);

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  
  return `${API_BASE_URL}${cleanPath}`;
};
