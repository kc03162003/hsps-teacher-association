(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96849,e=>{"use strict";var t=e.i(43476),a=e.i(71645),n=e.i(22016);e.s(["default",0,function(){let[s,r]=(0,a.useState)({name:"",paidAmount:"",accountLastFive:"",transferDate:new Date().toISOString().split("T")[0]}),[i,o]=(0,a.useState)(!1),[l,c]=(0,a.useState)(!1),[d,m]=(0,a.useState)(!1),[p,u]=(0,a.useState)(null),h=e=>{let{name:t,value:a}=e.target;r(e=>({...e,[t]:a}))},g=async()=>{if(!s.name)return alert("請先輸入姓名再進行查詢");m(!0),u(null);try{let{collection:t,query:a,where:n,getDocs:r}=await e.A(27510),{db:i}=await e.A(64266),o=a(t(i,"teacher_association_forms"),n("name","==",s.name)),l=await r(o);if(l.empty)alert("找不到該姓名的登記資料，請確認您輸入的姓名無誤，若姓名無誤，表示您尚未登記您要加入的教師會，請至表單登記網頁登記，謝謝!");else{let e=l.docs[0].data(),t=[];e.joinHaishan&&t.push("海山校教師會"),e.joinNFEU&&t.push("全教產"),e.joinNTA&&t.push("全教總"),e.joinNone&&t.push("不加入任何教師會"),u({unit:e.unit,name:e.name,associations:t.join("、 "),totalFee:e.totalFee,isReconciled:e.isReconciled||!1,reconciledAt:e.reconciledAt?e.reconciledAt.toDate?e.reconciledAt.toDate().toLocaleDateString("zh-TW"):new Date(e.reconciledAt).toLocaleDateString("zh-TW"):null})}}catch(e){console.error(e),alert("網路錯誤，請稍後再試。")}m(!1)},x=async t=>{if(t.preventDefault(),!s.name||!s.paidAmount||!s.accountLastFive||!s.transferDate)return alert("請填寫完整資訊");c(!0);try{let{collection:t,query:a,where:n,getDocs:r,updateDoc:i,doc:l}=await e.A(27510),{db:d}=await e.A(64266),m=a(t(d,"teacher_association_forms"),n("name","==",s.name)),p=await r(m);if(p.empty){alert("找不到該姓名的登記資料，請確認您輸入的姓名無誤，若姓名無誤，表示您尚未登記您要加入的教師會，請至表單登記網頁登記，謝謝!"),c(!1);return}let u=p.docs[0],h=u.data();if(parseInt(s.paidAmount)!==h.totalFee){alert("您的繳費金額與您之前登記的金額不同，請確認您的資料無誤。"),c(!1);return}await i(l(d,"teacher_association_forms",u.id),{paidAmount:parseInt(s.paidAmount),accountLastFive:s.accountLastFive,transferDate:s.transferDate}),o(!0)}catch(e){console.error(e),alert("網路錯誤，請稍後再試。")}c(!1)};return i?(0,t.jsxs)("div",{className:"container text-center",children:[(0,t.jsx)("h2",{children:"回報成功！"}),(0,t.jsx)("div",{className:"alert alert-success mt-1 mb-2",children:"您已成功回報繳費資訊，管理員將會進行對帳。"}),(0,t.jsx)(n.default,{href:"/",className:"btn btn-primary mt-2",style:{display:"inline-block"},children:"返回首頁"})]}):(0,t.jsxs)("div",{className:"container",children:[(0,t.jsx)("h1",{className:"text-center",children:"回報繳費資訊"}),(0,t.jsxs)("div",{className:"mb-2",style:{opacity:.8,lineHeight:"1.8",background:"rgba(0,0,0,0.02)",padding:"1rem",borderRadius:"8px"},children:[(0,t.jsx)("p",{style:{margin:0},children:"1. 如不確定您上次填寫的內容，請輸入姓名，按「查詢登記資訊」。"}),(0,t.jsx)("p",{style:{margin:0},children:"2. 如已確定您上次填寫內容，請輸入姓名後，直接填寫金額與帳號後五碼，按「送出回報」。"})]}),(0,t.jsxs)("form",{onSubmit:x,children:[(0,t.jsxs)("div",{className:"form-group",children:[(0,t.jsx)("label",{className:"form-label",children:"姓名"}),(0,t.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr auto",gap:"10px"},children:[(0,t.jsx)("input",{type:"text",name:"name",className:"form-input",placeholder:"請輸入您登記的真實姓名",value:s.name,onChange:h,required:!0,style:{flex:1}}),(0,t.jsx)("button",{type:"button",onClick:g,className:"btn",style:{width:"auto",flex:"0 0 auto",padding:"0 1rem",whiteSpace:"nowrap",backgroundColor:"#e2e8f0",color:"#1e293b"},disabled:d,children:d?"查詢中...":"查詢登記資訊"})]})]}),p&&(0,t.jsxs)("div",{className:"alert mt-1 mb-1",style:{backgroundColor:"#f0f9ff",color:"#0369a1",borderColor:"#bae6fd"},children:[(0,t.jsx)("h3",{style:{marginTop:0,marginBottom:"0.5rem",fontSize:"1.1rem"},children:"您的登記資訊"}),(0,t.jsxs)("p",{style:{margin:"0.2rem 0"},children:[(0,t.jsx)("strong",{children:"單位："}),p.unit,"    ",(0,t.jsx)("strong",{children:"姓名："}),p.name]}),(0,t.jsxs)("p",{style:{margin:"0.2rem 0"},children:[(0,t.jsx)("strong",{children:"參加教師會："}),p.associations]}),(0,t.jsxs)("p",{style:{margin:"0.2rem 0"},children:[(0,t.jsx)("strong",{children:"應繳交金額："}),p.totalFee," 元"]}),(0,t.jsxs)("div",{style:{margin:"0.5rem 0",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[(0,t.jsxs)("p",{style:{margin:0},children:[(0,t.jsx)("strong",{children:"目前對帳狀態："}),p.isReconciled?(0,t.jsxs)("span",{style:{color:"#059669",fontWeight:"bold"},children:["✅ 已完成對帳 ",p.reconciledAt?`(${p.reconciledAt})`:""]}):(0,t.jsx)("span",{style:{color:"#ea580c",fontWeight:"bold"},children:"⏳ 尚未對帳 (或處理中)"})]}),p.isReconciled&&(0,t.jsx)("button",{type:"button",onClick:()=>{if(!p)return;let e=window.open("","_blank");e.document.write(`
      <html>
        <head>
          <title>繳費收據 - ${p.name}</title>
          <style>
            body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; color: #333; }
            .receipt-box { border: 2px solid #333; padding: 40px; max-width: 600px; margin: 0 auto; position: relative; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(0,0,0,0.05); z-index: -1; white-space: nowrap; font-weight: bold; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 30px; letter-spacing: 2px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 1.2rem; }
            .row.single { justify-content: flex-start; gap: 20px; }
            .footer { margin-top: 60px; text-align: right; font-size: 1.1rem; border-top: 1px dashed #ccc; padding-top: 20px; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="watermark">海山國小教師會</div>
            <h1>海山國小教師會 繳費收據</h1>
            <div class="row">
              <span><strong>單位：</strong> ${p.unit}</span>
              <span><strong>姓名：</strong> ${p.name}</span>
            </div>
            <div class="row single">
              <span><strong>參與組織項目：</strong> ${p.associations}</span>
            </div>
            <div class="row single">
              <span><strong>實收金額：</strong> 新台幣 <span style="font-size:1.5rem; font-weight:bold;">${p.totalFee}</span> 元整</span>
            </div>
            <div class="row single">
              <span><strong>對帳狀態：</strong> ✅ 已由系統核銷對帳 ${p.reconciledAt?`(對帳日期：${p.reconciledAt})`:""}</span>
            </div>
            <div class="footer">
              <p>收款單位：海山國小教師會</p>
              <p>列印日期：${new Date().toLocaleDateString("zh-TW")}</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `),e.document.close()},className:"btn btn-primary",style:{width:"auto",padding:"0.2rem 1rem",fontSize:"0.9rem",whiteSpace:"nowrap"},children:"🖨️ 下載/列印收據"})]}),(0,t.jsx)("hr",{style:{margin:"0.5rem 0",borderColor:"#bae6fd",opacity:.5}}),(0,t.jsx)("p",{style:{margin:0,fontSize:"0.9rem",color:"#dc2626"},children:"※ 如內容有誤請洽教師會"})]}),(0,t.jsxs)("div",{className:"grid grid-cols-3 gap-1 mt-1",children:[(0,t.jsxs)("div",{className:"form-group",children:[(0,t.jsx)("label",{className:"form-label",children:"匯款日期"}),(0,t.jsx)("input",{type:"date",name:"transferDate",className:"form-input",value:s.transferDate,onChange:h,required:!0})]}),(0,t.jsxs)("div",{className:"form-group",children:[(0,t.jsx)("label",{className:"form-label",children:"已繳金額"}),(0,t.jsx)("input",{type:"number",name:"paidAmount",className:"form-input",placeholder:"例如：1400",value:s.paidAmount,onChange:h,required:!0})]}),(0,t.jsxs)("div",{className:"form-group",children:[(0,t.jsx)("label",{className:"form-label",children:"匯款帳號後五碼"}),(0,t.jsx)("input",{type:"text",name:"accountLastFive",className:"form-input",placeholder:"例如：12345 (若繳現金請填寫「現金」)",maxLength:10,value:s.accountLastFive,onChange:h,required:!0})]})]}),(0,t.jsx)("button",{type:"submit",className:"btn btn-primary mt-1",disabled:l,children:l?"處理中...":"送出回報"})]})]})}])},27510,e=>{e.v(t=>Promise.all(["static/chunks/1jh7fho4142oc.js","static/chunks/379usl-bfonvu.js"].map(t=>e.l(t))).then(()=>t(48323)))},64266,e=>{e.v(t=>Promise.all(["static/chunks/33b7a2zi9akz1.js","static/chunks/379usl-bfonvu.js"].map(t=>e.l(t))).then(()=>t(91557)))}]);