import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('./install.sh',import.meta.url));
const src=readFileSync(file,'utf8');
test('installer shell syntax, help, invalid arguments are safe on development host',()=>{
 assert.equal(spawnSync('sh',['-n',file]).status,0);
 assert.equal(spawnSync('sh',[file,'--help']).status,0);
 assert.notEqual(spawnSync('sh',[file,'--force']).status,0);
});
test('fixed version and public-key fingerprint; no untrusted install or curl-pipe-shell',()=>{
 assert.match(src,/RELEASE=0\.1\.0-r12/);
 assert.match(src,/KEY_SHA=[a-f0-9]{64}/);
 assert.equal(src.includes('--allow-untrusted'),false);
 assert.match(src,/apk --keys-dir .* verify/);
 assert.ok(src.indexOf("idle\necho") < src.indexOf('mktemp'));
 assert.ok(src.indexOf('APK signature verification failed') < src.indexOf('apk --no-network add'));
 assert.match(src,/refusing to replace it/);
 assert.equal(/ATD|ATA|CMGS|CMGD|reboot|rm -rf/.test(src),false);
});
// Exercise the actual idle() shell function, including jsonfilter's nonzero
// exit for absent keys. No device/filesystem/network commands are executed.
const idle=src.slice(src.indexOf('idle() {'),src.indexOf('\nidle\necho'));
function check({calls='OK',sms='none',bridge='off'}={}){
 const fixture=`set -eu
fail() { echo "$*" >&2; exit 1; }
mu300_at() { printf '%s\\n' '${calls}'; }
pidof() { ${bridge==='off'?'return 1':'return 0'}; }
wget() { echo status; }
ubus() { if [ "$1" = list ]; then echo mu300dash; else echo '${sms}'; fi; }
jsonfilter() {
 read -r v || true
 case "$*:$v" in
  *audio.active:status|*call_active:status) echo '${bridge==='busy'?'true':'false'}' ;;
  *running:running) echo 1 ;;
  *running:*) return 1 ;;
  *:none|*:done) echo 1 ;;
  *) return 1 ;;
 esac
}
${idle.replaceAll('mu300-at', 'mu300_at')}
idle
echo passed`;
 return spawnSync('sh',['-c',fixture],{encoding:'utf8'});
}
test('idle permits absent running key for native none/done job',()=>{
 assert.equal(check().status,0);
 assert.equal(check({sms:'done',bridge:'idle'}).status,0);
});
test('idle rejects calls, media, running SMS, unknown SMS and invalid CLCC',()=>{
 for(const data of [{calls:'+CLCC: fixture\nOK'},{calls:'ERROR'},{sms:'running'},{sms:'unknown'},{bridge:'busy'}])assert.notEqual(check(data).status,0);
});
