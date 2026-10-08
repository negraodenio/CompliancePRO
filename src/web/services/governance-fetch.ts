const governedPath = /^\/api\/v1\/(agents|runtimes|executions|models|tools|data|evidence|compliance-profiles|capabilities|guardian)(\/|$)/;
export function governanceHeaders(): Record<string,string> {
  if (typeof localStorage === 'undefined') return {};
  const token = localStorage.getItem('cgag_auth_token');
  const tenant = localStorage.getItem('cgag_active_org_id');
  return { ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(tenant ? {'X-Organization-Id':tenant} : {}) };
}
export function installGovernanceFetch(): void {
  if (typeof window === 'undefined') return;
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
    if (url.origin !== window.location.origin || !governedPath.test(url.pathname)) return original(input,init);
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value,key) => headers.set(key,value));
    for (const [key,value] of Object.entries(governanceHeaders())) if (!headers.has(key)) headers.set(key,value);
    return original(input,{...init,headers});
  };
}
