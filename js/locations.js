export const GHANA_REGIONS = [
"Ahafo","Ashanti","Bono","Bono East","Central","Eastern","Greater Accra","North East",
"Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North"
];
export const GHANA_LOCATIONS = [
"Accra","Kumasi","Tema","Takoradi","Cape Coast","Tamale","Sunyani","Ho","Koforidua",
"Bolgatanga","Wa","Techiman","Obuasi","Tarkwa","Kasoa","Madina","East Legon","Spintex",
"Adenta","Dansoman","Rest of Ghana"
];
export function populateLocationSelect(select, regions=true){
  if(!select)return;
  select.innerHTML = `<option value="">Any location</option>` + (regions?GHANA_REGIONS:GHANA_LOCATIONS).map(x=>`<option value="${x}">${x}</option>`).join("");
}