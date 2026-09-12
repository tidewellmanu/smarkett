export const COUNTRIES = {
  GH:{name:"Ghana",currency:"GHS",symbol:"GH₵",phone:"+233",locale:"en-GH",url:null},
  ZA:{name:"South Africa",currency:"ZAR",symbol:"R",phone:"+27",locale:"en-ZA",url:null},
  KE:{name:"Kenya",currency:"KES",symbol:"KSh",phone:"+254",locale:"en-KE",url:null},
  UG:{name:"Uganda",currency:"UGX",symbol:"USh",phone:"+256",locale:"en-UG",url:null},
  RW:{name:"Rwanda",currency:"RWF",symbol:"RF",phone:"+250",locale:"en-RW",url:null},
  ET:{name:"Ethiopia",currency:"ETB",symbol:"Br",phone:"+251",locale:"en-ET",url:null},
  CI:{name:"Côte d’Ivoire",currency:"XOF",symbol:"CFA",phone:"+225",locale:"fr-CI",url:null},
  SN:{name:"Senegal",currency:"XOF",symbol:"CFA",phone:"+221",locale:"fr-SN",url:null},
  MA:{name:"Morocco",currency:"MAD",symbol:"DH",phone:"+212",locale:"fr-MA",url:null},
  CV:{name:"Cape Verde",currency:"CVE",symbol:"CVE",phone:"+238",locale:"pt-CV",url:null},
  AO:{name:"Angola",currency:"AOA",symbol:"Kz",phone:"+244",locale:"pt-AO",url:null},
  CD:{name:"DR Congo",currency:"CDF",symbol:"FC",phone:"+243",locale:"fr-CD",url:null},
  CG:{name:"Republic of Congo",currency:"XAF",symbol:"FCFA",phone:"+242",locale:"fr-CG",url:null},
  BD:{name:"Bangladesh",currency:"BDT",symbol:"৳",phone:"+880",locale:"bn-BD",url:null},
  AE:{name:"Dubai / UAE",currency:"AED",symbol:"AED",phone:"+971",locale:"en-AE",url:null},
  AL:{name:"Albania",currency:"ALL",symbol:"Lek",phone:"+355",locale:"sq-AL",url:null}
};
export const COUNTRY_ORDER = ["GH","ZA","KE","UG","RW","ET","CI","SN","MA","CV","AO","CD","CG","BD","AE","AL"];
export function currentCountry(){ return localStorage.getItem("mh_country") || "GH"; }
export function setCountry(code){ if(COUNTRIES[code]) localStorage.setItem("mh_country",code); }
export function formatPrice(amount, code=currentCountry()){
  const c=COUNTRIES[code]||COUNTRIES.GH;
  try{return new Intl.NumberFormat(c.locale,{style:"currency",currency:c.currency,maximumFractionDigits:c.currency==="UGX"||c.currency==="RWF"||c.currency==="XOF"?0:2}).format(Number(amount)||0);}
  catch{return `${c.symbol} ${(Number(amount)||0).toLocaleString()}`;}
}