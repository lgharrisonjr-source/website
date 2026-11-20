// Inquiry form submit UX: no page navigation, disabled-while-sending, honest inline status.
(function(){
  var f=document.getElementById('inquiry-form'); if(!f) return;
  var btn=document.getElementById('inq-submit'), st=document.getElementById('inq-status');
  var label=btn.textContent;
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    if(btn.disabled) return;
    st.textContent='';
    if(!f.reportValidity()) return;
    btn.disabled=true; btn.textContent='Sending...';
    var fd=new FormData(f);
    fetch(f.action,{method:'POST',body:fd}).then(function(r){
      return r.json().catch(function(){return {error:'Unexpected response'};}).then(function(d){
        if(r.ok&&d.sent){ f.reset(); st.textContent='Message sent. We reply by email.'; }
        else { st.textContent=d.error||'The message could not be sent. Please try again.'; }
      });
    }).catch(function(){ st.textContent='The message could not be sent. Check your connection and try again.'; })
    .finally(function(){ btn.disabled=false; btn.textContent=label; });
  });
})();
