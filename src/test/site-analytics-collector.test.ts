import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import handler from '../../api/visit';
const token='a'.repeat(64);
const body={id:'ae111111-1111-4111-8111-111111111111',visitor_id:'ae222222-2222-4222-8222-222222222222',session_id:'ae333333-3333-4333-8333-333333333333',path:'/cart',event_name:'page_view',referrer:'google.com',source:'google',medium:'search',campaign:'launch',language:'en-NG',country:'US'};
async function run(headers:Record<string,string>={},value:unknown=body,method='POST'){
 const request={method,body:value,headers:{origin:'https://1vet.store','user-agent':'Mozilla Chrome/120 Windows','x-vercel-ip-country':'NG','x-vercel-ip-country-region':'OY','x-vercel-ip-city':'Ibadan','x-vercel-forwarded-for':'192.0.2.12',...headers}};
 const response={statusCode:0,setHeader:vi.fn(),end:vi.fn()};await handler(request as unknown as Parameters<typeof handler>[0],response as unknown as Parameters<typeof handler>[1]);return response;
}
beforeEach(()=>{vi.stubEnv('SITE_ANALYTICS_KEY',token);vi.stubEnv('VERCEL','1');vi.stubEnv('VERCEL_ENV','production');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('true',{status:200})));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('Vercel analytics collector',()=>{
 it('uses trusted server geography instead of client fields and sends only a daily hash for rate limits',async()=>{
  expect((await run()).statusCode).toBe(204);const options=vi.mocked(fetch).mock.calls[0]![1]!;const sent=JSON.parse(options.body as string);expect(sent.payload).toMatchObject({country:'NG',region:'OY',city:'Ibadan',device:'desktop',browser:'Chrome'});expect(sent.payload.abuse_key).toMatch(/^[a-f0-9]{64}$/);expect(JSON.stringify(sent.payload)).not.toContain('192.0.2.12');expect(sent.payload).not.toHaveProperty('user_agent');
 });
 it('excludes bots and browser privacy signals',async()=>{
  expect((await run({'user-agent':'Googlebot/2.1'})).statusCode).toBe(204);expect((await run({dnt:'1'})).statusCode).toBe(204);expect((await run({'sec-gpc':'1'})).statusCode).toBe(204);expect(fetch).not.toHaveBeenCalled();
 });
 it('rejects other origins, preview deployments and raw private paths',async()=>{
  expect((await run({origin:'https://example.invalid'})).statusCode).toBe(403);expect((await run({}, {...body,path:'/pets/private-id?token=secret'})).statusCode).toBe(400);vi.stubEnv('VERCEL_ENV','preview');expect((await run()).statusCode).toBe(503);expect(fetch).not.toHaveBeenCalled();
 });
 it('keeps health checks secret-free and reports missing configuration',async()=>{
  const response=await run({},null,'GET');expect(response.statusCode).toBe(200);expect(response.end.mock.calls[0]![0]).not.toContain(token);vi.stubEnv('SITE_ANALYTICS_KEY','');expect((await run()).statusCode).toBe(503);
 });
 it('keeps absent location unknown rather than guessing from language',async()=>{
  await run({'x-vercel-ip-country':'','x-vercel-ip-country-region':'','x-vercel-ip-city':''});const sent=JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);expect(sent.payload.country).toBeNull();expect(sent.payload.city).toBeNull();
 });
});
