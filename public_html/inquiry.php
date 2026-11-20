<?php
// FinancialTherapy360 inquiry endpoint (Community Support + Contact). Candidate, NONPRODUCTION.
// Delivers plain-text inquiries to support@financialtherapy360.com. No attachments, no account data.
declare(strict_types=1);
header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer');
function iout(array $d,int $s=200): void { http_response_code($s); header('Content-Type: application/json'); echo json_encode($d); exit; }
function icfg(): array { static $c=null; if($c===null){ $c=require dirname(__DIR__).'/ft360_private/inquiry-config.php'; } return $c; }
try{
  if($_SERVER['REQUEST_METHOD']!=='POST') iout(['error'=>'Not allowed'],405);
  $o=$_SERVER['HTTP_ORIGIN']??'';
  $extra=icfg()['allowed_origins']??[]; if(!is_array($extra)) $extra=[];
  if($o!==''&&!in_array($o,array_merge(['https://financialtherapy360.com','https://www.financialtherapy360.com'],$extra),true)) iout(['error'=>'Not allowed'],403);
  $ct=(string)($_SERVER['CONTENT_TYPE']??'');
  $in=strpos($ct,'application/json')===0 ? json_decode((string)file_get_contents('php://input',false,null,0,16384),true) : $_POST;
  if(!is_array($in)) iout(['error'=>'Invalid request'],400);
  $g=function(string $k) use($in): string { return isset($in[$k])&&is_string($in[$k])?trim($in[$k]):''; };
  // honeypot: real users never see or fill this field
  if($g('website')!=='') iout(['sent'=>true]); // pretend-accept, deliver nothing
  $page=$g('page'); if(!in_array($page,['community-support','contact'],true)) iout(['error'=>'Invalid request'],400);
  $name=$g('name'); $email=$g('email'); $subject=$g('subject'); $msg=$g('message');
  $subjects=['General Inquiry','Account or login help','Community Support program question','Partnership or press','Other'];
  if($page==='community-support'){
    $subject='Community Support';
  } elseif(!in_array($subject,$subjects,true)) iout(['error'=>'Please choose a subject'],422);
  if(strlen($name)<2||strlen($name)>80) iout(['error'=>'Please add your name'],422);
  if(!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($email)>120) iout(['error'=>'Please add a valid email address'],422);
  $mailSubject=$page==='community-support'?'Community Support':("[FT360 $page] ".$subject);
  if(strlen($msg)<20||strlen($msg)>4000) iout(['error'=>'Please write a message between 20 and 4000 characters'],422);
  // header-injection guard: no CR/LF in fields that enter headers
  foreach([$name,$email,$subject] as $h){ if(preg_match('/[\r\n]/',$h)) iout(['error'=>'Invalid request'],400); }
  // per-IP rate limit: 5 inquiries per hour, file counters under the private dir
  $rl=dirname(__DIR__).'/ft360_private/inquiry-rl'; if(!is_dir($rl)&&!@mkdir($rl,0700)&&!is_dir($rl)) iout(['error'=>'Please try again shortly.'],503);
  $k=$rl.'/'.hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'')).'.cnt';
  $h=@fopen($k,'c+'); if(!$h) iout(['error'=>'Please try again shortly.'],503); flock($h,LOCK_EX);
  $st=json_decode((string)stream_get_contents($h),true); $now=time();
  if(!is_array($st)||$now-($st['t']??0)>3600) $st=['t'=>$now,'n'=>0]; $st['n']++;
  ftruncate($h,0); rewind($h); fwrite($h,json_encode($st)); flock($h,LOCK_UN); fclose($h);
  if($st['n']>5) iout(['error'=>'Too many messages. Please wait a while and try again.'],429);
  $c=icfg();
  $body="Page: ".($page==='community-support'?'Community Support':'Contact')."\nName: $name\nEmail: $email\nSubject: $subject\n\n$msg\n";
  $hdr="From: FinancialTherapy360 website <".$c['from'].">\r\nReply-To: $name <$email>\r\nContent-Type: text/plain; charset=utf-8";
  if(($c['driver']??'capture')==='capture'){
    $box=$c['capture_dir']; if(!is_dir($box)&&!@mkdir($box,0700)&&!is_dir($box)) iout(['error'=>'Please try again shortly.'],503);
    $f=$box.'/'.date('Ymd-His').'-'.bin2hex(random_bytes(4)).'.eml';
    if(@file_put_contents($f,"To: {$c['to']}\r\nSubject: $mailSubject\r\n$hdr\r\n\r\n$body")===false) iout(['error'=>'Please try again shortly.'],503);
  } else {
    if(!ismtp_send($c,$mailSubject,$hdr,$body)) iout(['error'=>'The message could not be sent right now. Please try again later.'],502);
  }
  iout(['sent'=>true]);
}catch(Throwable $e){ error_log('ft360 inquiry error '.get_class($e)); iout(['error'=>'Something went wrong. Please try again.'],500); }

function ismtp_send(array $c,string $mailSubject,string $hdr,string $body): bool {
  $s=@stream_socket_client('ssl://'.$c['smtp_host'].':'.(int)$c['smtp_port'],$en,$es,15); if(!$s) return false;
  $rd=function() use($s): string { $r=''; while(($l=fgets($s,515))!==false){ $r.=$l; if(strlen($l)>=4&&$l[3]===' ') break; } return $r; };
  $ok=function(string $cmd,string $expect) use($s,$rd): bool { fwrite($s,$cmd."\r\n"); return strpos($rd(),$expect)===0; };
  if(strpos($rd(),'220')!==0) { fclose($s); return false; }
  if(!$ok('EHLO financialtherapy360.com','250')) { fclose($s); return false; }
  if(!$ok('AUTH LOGIN','334')) { fclose($s); return false; }
  if(!$ok(base64_encode($c['smtp_user']),'334')) { fclose($s); return false; }
  if(!$ok(base64_encode($c['smtp_pass']),'235')) { fclose($s); return false; }
  if(!$ok('MAIL FROM:<'.$c['from'].'>','250')) { fclose($s); return false; }
  if(!$ok('RCPT TO:<'.$c['to'].'>','250')) { fclose($s); return false; }
  if(!$ok('DATA','354')) { fclose($s); return false; }
  $data="To: {$c['to']}\r\nSubject: $mailSubject\r\n$hdr\r\n\r\n".str_replace("\n","\r\n",str_replace("\r\n","\n",$body));
  // dot-stuffing
  $data=preg_replace('/\r\n\./',"\r\n..",$data);
  fwrite($s,$data."\r\n.\r\n"); $r=$rd();
  $okq=strpos($r,'250')===0; fwrite($s,"QUIT\r\n"); fclose($s); return $okq;
}
