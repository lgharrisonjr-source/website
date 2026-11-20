<?php
// FinancialTherapy360 file API (public entry; all secrets and files live outside the web root).
declare(strict_types=1);
require dirname($_SERVER['DOCUMENT_ROOT']).'/ft360_private/lib.php';
header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer');
function out(array $d,int $s=200): void { http_response_code($s); header('Content-Type: application/json'); echo json_encode($d); exit; }
try{
  if($_SERVER['REQUEST_METHOD']!=='POST') throw new FtHttp(405,'Not allowed');
  $o=$_SERVER['HTTP_ORIGIN']??''; if($o!==''&&$o!=='https://financialtherapy360.com'&&$o!=='https://www.financialtherapy360.com') throw new FtHttp(403,'Not allowed');
  $cl0=null; $len=(int)($_SERVER['CONTENT_LENGTH']??0); if($len>13*1024*1024) throw new FtHttp(413,'File is too large');
  ft_rate('ip:'.($_SERVER['REMOTE_ADDR']??''),120,300);
  $cl=ft_auth(); ft_rate('u:'.$cl['sub'],60,300); $uid=$cl['sub']; $act=(string)($_GET['a']??'');
  $in=($len>0&&$len<=8192&&strpos((string)($_SERVER['CONTENT_TYPE']??''),'multipart/')!==0)?json_decode((string)file_get_contents('php://input',false,null,0,8192),true):null; if(!is_array($in)) $in=[];
  $get=function(string $k) use($in){ return isset($_POST[$k])?(string)$_POST[$k]:(isset($in[$k])?(string)$in[$k]:''); };
  $upload=function(string $purpose,int $max) {
    if(!isset($_FILES['file'])||$_FILES['file']['error']!==UPLOAD_ERR_OK||!is_uploaded_file($_FILES['file']['tmp_name'])) throw new FtHttp(422,'No file received');
    if($_FILES['file']['size']>$max) throw new FtHttp(422,'File is too large');
    return (string)file_get_contents($_FILES['file']['tmp_name']);
  };
  switch($act){
    // ---- ID (customer) ----
    case 'id_begin': out(ft_call('id_begin',[$get('notice'),$get('accepted')==='true'],$cl));
    case 'id_upload': ft_rate('up:'.$uid,12,3600);
      $sub=ft_uuid($get('submission')); $kind=$get('kind');
      $r=ft_call('id_reserve',[$sub,$kind],$cl); $fid=$r['fileId']; $max=(int)$r['maxBytes'];
      $path=ft_path('id',$uid,$sub,$fid); $lk=ft_lock($fid); $gl=null; $fin=null;
      try{
        $c=ft_clean_image($upload('id',$max),$max);
        $gl=ft_global_lock(); ft_budget(strlen($c['bytes'])); ft_store_locked($path,$c['bytes']);
        try{ $fin=ft_call('id_finalize',[$fid,strlen($c['bytes']),$c['mime'],$c['sha'],$c['w'],$c['h']],$cl); }
        catch(Throwable $e){ ft_remove_locked($path); throw $e; }
        ft_unlock($gl); $gl=null;
        foreach(($fin['replaced']??[]) as $old){ ft_run_removals([['userId'=>$uid,'submissionId'=>$sub,'fileId'=>$old]],'id',$uid); }
      }catch(Throwable $e){ if($gl) ft_unlock($gl); ft_unlock($lk); $lk=null; throw $e; }
      ft_unlock($lk);
      out(['saved'=>true,'fileId'=>$fid]);
    case 'id_submit': out(ft_call('id_submit',[ft_uuid($get('submission'))],$cl));
    case 'id_list': out(ft_call('id_list_own',[],$cl));
    case 'id_view': $v=ft_call('id_view_own',[ft_uuid($get('file'))],$cl); ft_stream(ft_path('id',$v['userId'],$v['submissionId'],$v['fileId']),$v['mime'],$v['sha256'],true); exit;
    case 'id_withdraw': $r=ft_call('id_withdraw',[ft_uuid($get('submission'))],$cl); $l=ft_call('sweep_list'); $n=ft_run_removals($l['id']??[],'id',$uid,ft_uuid($get('submission'))); out($r+['removedNow'=>$n]);
    // ---- ID (reviewer) ----
    case 'rev_queue': out(ft_call('id_queue',[],$cl));
    case 'rev_open': $v=ft_call('id_open',[ft_uuid($get('file'))],$cl); ft_stream(ft_path('id',$v['userId'],$v['submissionId'],$v['fileId']),$v['mime'],$v['sha256'],true); exit;
    case 'rev_decide': out(ft_call('id_decide',[ft_uuid($get('submission')),$get('decision'),$get('reason')],$cl));
    case 'rev_purge': $r=ft_call('id_request_purge',[ft_uuid($get('submission'))],$cl); $l=ft_call('sweep_list'); $n=ft_run_removals($l['id']??[],'id',null,ft_uuid($get('submission'))); out($r+['removedNow'=>$n]);
    // ---- ordinary documents ----
    case 'doc_accept': out(ft_call('doc_accept_notice',[$get('notice'),$get('accepted')==='true'],$cl));
    case 'doc_upload': ft_rate('up:'.$uid,12,3600);
      $r=ft_call('doc_reserve',[$get('category')],$cl); $fid=$r['fileId']; $max=(int)$r['maxBytes']; $path=ft_path('doc',$uid,null,$fid);
      $lk=ft_lock($fid); $gl=null;
      try{
        $c=ft_clean_doc($upload('doc',$max),$max);
        $gl=ft_global_lock(); ft_budget(strlen($c['bytes'])); ft_store_locked($path,$c['bytes']);
        try{ ft_call('doc_finalize',[$fid,strlen($c['bytes']),$c['mime'],$c['sha']],$cl); }
        catch(Throwable $e){ ft_remove_locked($path); throw $e; }
        ft_unlock($gl); $gl=null;
      }catch(Throwable $e){ if($gl) ft_unlock($gl); ft_unlock($lk); $lk=null; throw $e; }
      ft_unlock($lk);
      out(['saved'=>true,'fileId'=>$fid]);
    case 'doc_list': out(ft_call('doc_list_own',[],$cl));
    case 'doc_view': $v=ft_call('doc_view_own',[ft_uuid($get('file'))],$cl); $p=ft_path('doc',$v['userId'],null,$v['fileId']);
      $row=ft_call('doc_hash',[$v['fileId']],$cl); ft_stream($p,$v['mime'],$row['sha256'],true); exit;
    case 'doc_remove': $r=ft_call('doc_remove_own',[ft_uuid($get('file'))],$cl); $l=ft_call('sweep_list'); $n=ft_run_removals($l['doc']??[],'doc',$uid,null,ft_uuid($get('file'))); out($r+['removedNow'=>$n]);
    default: throw new FtHttp(404,'Not found');
  }
}catch(FtHttp $e){ out(['error'=>$e->getMessage()],$e->status);
}catch(PDOException $e){ $st=(string)$e->getCode(); $m=$e->getMessage();
  if(($st==='42501'||$st==='22023') && preg_match('/ERROR:\s+(.+?)(\n|$)/',$m,$mm)) out(['error'=>trim($mm[1])],403);
  error_log('ft360 db error '.$st); out(['error'=>'Something went wrong. Please try again.'],500);
}catch(Throwable $e){ error_log('ft360 error '.get_class($e)); out(['error'=>'Something went wrong. Please try again.'],500); }
