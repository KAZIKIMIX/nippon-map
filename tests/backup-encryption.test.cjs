const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nippon-backup-test-'));
const keyring=path.join(tmp,'keyring');fs.mkdirSync(keyring,{mode:0o700});
function gpg(args){const r=spawnSync('gpg',['--batch','--homedir',keyring,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;}
try{
 gpg(['--pinentry-mode','loopback','--passphrase','','--quick-generate-key','Nippon Map Backup Fixture','rsa2048','encr','1d']);
 const fp=gpg(['--with-colons','--fingerprint','--list-keys']).split('\n').find(l=>l.startsWith('fpr:')).split(':')[9];
 const publicKey=gpg(['--armor','--export',fp]);
 const input=path.join(tmp,'fixture.dump'),output=path.join(tmp,'fixture.dump.gpg');
 fs.writeFileSync(input,'PUBLIC TEST FIXTURE: no production data\n');
 const env={...process.env,BACKUP_GPG_PUBLIC_KEY:publicKey,BACKUP_GPG_FINGERPRINT:fp};
 const run=(extra={},out=output)=>spawnSync('bash',['scripts/encrypt-db-backup.sh',input,out],{encoding:'utf8',env:{...env,...extra}});
 assert.equal(run().status,0,'Encrypt fixture with only the public key');
 assert.notDeepEqual(fs.readFileSync(output),fs.readFileSync(input));
 const decoded=gpg(['--decrypt',output]);assert.equal(decoded,fs.readFileSync(input,'utf8'));
 assert.notEqual(run({BACKUP_GPG_FINGERPRINT:'0'.repeat(40)},path.join(tmp,'wrong.gpg')).status,0);
 assert.equal(fs.existsSync(path.join(tmp,'wrong.gpg')),false,'Wrong recipient must not produce an artifact');
 assert.notEqual(run({BACKUP_GPG_PUBLIC_KEY:''},path.join(tmp,'missing.gpg')).status,0);
 assert.notEqual(run().status,0,'Never overwrite an existing output');
 const workflow=fs.readFileSync('.github/workflows/manual-db-backup.yml','utf8');
 assert.ok(workflow.includes('backup/nippon-map-public.dump.gpg'));
 assert.ok(!workflow.includes('path: backup/'),'Upload only explicitly named encrypted files');
 console.log('Backup encryption tests passed: fixture round-trip, wrong/missing key refusal, no overwrite and encrypted-only upload.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
