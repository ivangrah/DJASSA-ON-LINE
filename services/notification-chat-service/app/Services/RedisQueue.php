<?php
namespace App\Services;
use Illuminate\Support\Facades\Log;
/** File de jobs asynchrone Redis (RESP LPUSH / BRPOP) sans extension ni dépendance. */
class RedisQueue
{
    public function __construct(private readonly string $host, private readonly int $port, private readonly string $queue) {}
    public function push(string $type, array $payload): bool
    {
        $value = json_encode(['type'=>$type,'payload'=>$payload,'queued_at'=>now()->toIso8601String()], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        return $this->command(['LPUSH',$this->queue,$value]) !== null;
    }
    public function pop(int $timeout = 1): ?array
    {
        $result = $this->command(['BRPOP',$this->queue,(string)$timeout]);
        if (! is_array($result) || count($result) < 2) return null;
        $data = json_decode((string) $result[1], true);
        return is_array($data) ? $data : null;
    }
    private function command(array $args): mixed
    {
        $socket = @fsockopen($this->host,$this->port,$errno,$errstr,0.3);
        if (! $socket) { Log::debug('[Queue] Redis indisponible'); return null; }
        try {
            fwrite($socket, $this->encode($args));
            return $this->read($socket);
        } catch (\Throwable $e) { Log::debug('[Queue] erreur', ['error'=>$e->getMessage()]); return null; }
        finally { fclose($socket); }
    }
    private function encode(array $args): string
    {
        $out='*'.count($args)."\r\n";
        foreach($args as $a){$out.='$'.strlen((string)$a)."\r\n".(string)$a."\r\n";}
        return $out;
    }
    private function read($socket,int $depth=0): mixed
    {
        $line=fgets($socket);
        if($line===false||$line===''||$depth>8)return null;
        $line=rtrim($line,"\r\n"); $t=$line[0]??''; $r=substr($line,1);
        if($t==='+')return $r;
        if($t==='-'||$t===':')return null;
        if($t==='$'){ $n=(int)$r; if($n<0)return null; $d=''; while(strlen($d)<$n){$c=fread($socket,$n-strlen($d)); if(!$c)break; $d.=$c;} fread($socket,2); return $d; }
        if($t==='*'){ $n=(int)$r; if($n<0)return null; $a=[]; for($i=0;$i<$n;$i++)$a[]=$this->read($socket,$depth+1); return $a; }
        return $line;
    }
}
