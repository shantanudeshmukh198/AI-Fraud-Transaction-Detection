document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("fraudForm");
const customerType=document.getElementById("customer_type");
const existingBox=document.getElementById("existingCustomerBox");
const newBox=document.getElementById("newCustomerBox");
const customerSelect=document.getElementById("customer_id");
const customerName=document.getElementById("customer_name");
const newCustomerName=document.getElementById("new_customer_name");
const dob=document.getElementById("dob");
const age=document.getElementById("age");
const gender=document.getElementById("gender");
const job=document.getElementById("job");
const state=document.getElementById("state");
const city=document.getElementById("city");
const zipCode=document.getElementById("zip_code");
const latitude=document.getElementById("latitude");
const longitude=document.getElementById("longitude");
const cityPopulation=document.getElementById("city_population");
const account=document.getElementById("account_id");
const merchant=document.getElementById("merchant_id");
const newDevice=document.getElementById("new_device");
const international=document.getElementById("is_international");
const amount=document.getElementById("amount");
const transactionType=document.getElementById("transaction_type");
const transactionTime=document.getElementById("transaction_time");
const errorBox=document.getElementById("formError");
const loading=document.getElementById("loading");
const resultBox=document.getElementById("resultBox");
const resultTitle=document.getElementById("resultTitle");
const predictionEl=document.getElementById("prediction");
const probabilityEl=document.getElementById("probability");
const riskEl=document.getElementById("riskLevel");
const modelEl=document.getElementById("usedModel");
const resultMessage=document.getElementById("resultMessage");
const predictBtn=document.getElementById("predictBtn");

const customerFields=[dob,gender,job,state,city,zipCode,latitude,longitude,cityPopulation];

function showError(msg){
    if(errorBox){
        errorBox.textContent=msg;
        errorBox.style.display="block";
    }
    if(loading)loading.style.display="none";
}

function clearError(){
    if(errorBox){
        errorBox.textContent="";
        errorBox.style.display="none";
    }
}

function setCustomerFieldsLocked(locked){
    customerFields.forEach(el=>{
        if(!el)return;

        if(el.tagName==="SELECT"){
            el.disabled=locked;
        }else{
            el.readOnly=locked;
        }
    });

    if(age)age.readOnly=true;
}

function calculateAge(){
    if(!dob||!age)return;

    if(!dob.value){
        age.value="";
        return;
    }

    const birth=new Date(dob.value);
    const today=new Date();

    let a=today.getFullYear()-birth.getFullYear();

    if(
        today.getMonth()<birth.getMonth() ||
        (
            today.getMonth()===birth.getMonth() &&
            today.getDate()<birth.getDate()
        )
    )a--;

    age.value=a;
}

if(dob)dob.addEventListener("change",calculateAge);

async function loadCustomers(){
    try{
        const res=await fetch("/api/customers");
        const data=await res.json();

        if(!data.success)
            throw new Error(data.message||"Unable to load customers.");

        customerSelect.innerHTML='<option value="">Select Customer</option>';

        data.customers.forEach(c=>{
            const option=document.createElement("option");

            option.value=c.customer_id;
            option.textContent=
                `${c.name||"Customer"}${c.city?" - "+c.city:""}`;

            option.dataset.customer=JSON.stringify(c);
            customerSelect.appendChild(option);
        });

    }catch(e){
        showError(e.message);
    }
}

async function loadAccounts(customerId){
    account.innerHTML='<option value="">Select Account</option>';

    if(!customerId)return;

    try{
        const res=await fetch(
            `/api/accounts?customer_id=${encodeURIComponent(customerId)}`
        );

        const data=await res.json();

        if(!data.success)
            throw new Error(data.message||"Unable to load accounts.");

        data.accounts.forEach(a=>{
            const option=document.createElement("option");

            option.value=a.account_id;
            option.textContent=
                `${a.account_type||"Account"} - ${a.account_number||a.account_id}`;

            account.appendChild(option);
        });

    }catch(e){
        showError(e.message);
    }
}

async function loadMerchants(){
    merchant.innerHTML='<option value="">Select Merchant</option>';

    try{
        const res=await fetch("/api/merchants");
        const data=await res.json();

        if(!data.success)
            throw new Error(data.message||"Unable to load merchants.");

        data.merchants.forEach(m=>{
            const option=document.createElement("option");

            option.value=m.merchant_id;
            option.textContent=
                `${m.merchant_name}${m.category?" - "+m.category:""}`;

            merchant.appendChild(option);
        });

    }catch(e){
        showError(e.message);
    }
}

function setNewCustomerAccounts(){
    account.innerHTML=
        '<option value="">Select Account</option>'+
        '<option value="new_savings">Savings Account</option>'+
        '<option value="new_current">Current Account</option>';
}

function clearLocationFields(){
    if(zipCode)zipCode.value="";
    if(latitude)latitude.value="";
    if(longitude)longitude.value="";
    if(cityPopulation)cityPopulation.value="";
}

function clearCustomerFields(){
    if(customerName)customerName.value="";
    if(dob)dob.value="";
    if(age)age.value="";
    if(gender)gender.value="";
    if(job)job.value="";
    if(state)state.value="";
    if(city)city.value="";
    clearLocationFields();
}

function fillCustomer(c){
    if(!c)return;

    customerName.value=c.name||"";

   if(c.date_of_birth){
    dob.value=String(c.date_of_birth).substring(0,10);
    }else{
    dob.value="";
    }

    if(c.age!==undefined&&c.age!==null&&c.age!==""){
        age.value=c.age;
    }else{
        calculateAge();
    }

    if(gender)gender.value=c.gender||c.sex||"";
    if(job)job.value=c.job||c.occupation||"";

    state.value=c.state||"";
    city.value=c.city||"";

    zipCode.value=c.zip_code??"";
    latitude.value=c.latitude??"";
    longitude.value=c.longitude??"";
    cityPopulation.value=c.city_population??"";
}

function updateCustomerType(){
    const type=customerType.value;

    clearError();

    if(type==="existing"){

        existingBox.style.display="block";
        newBox.style.display="none";

        customerSelect.required=true;
        newCustomerName.required=false;
        account.required=true;

        setCustomerFieldsLocked(true);

        account.innerHTML=
            '<option value="">Select Account</option>';

        if(customerSelect.value)
            loadAccounts(customerSelect.value);
        else
            clearCustomerFields();

    }else if(type==="new"){

        existingBox.style.display="none";
        newBox.style.display="block";

        customerSelect.required=false;
        newCustomerName.required=true;
        account.required=false;

        setCustomerFieldsLocked(false);

        clearCustomerFields();
        setNewCustomerAccounts();

    }else{

        existingBox.style.display="none";
        newBox.style.display="none";

        customerSelect.required=false;
        newCustomerName.required=false;
        account.required=false;

        setCustomerFieldsLocked(false);
        clearCustomerFields();

        account.innerHTML=
            '<option value="">Select Account</option>';
    }
}

customerType.addEventListener("change",updateCustomerType);

customerSelect.addEventListener("change",async()=>{

    clearError();

    const selected=
        customerSelect.options[customerSelect.selectedIndex];

    if(!customerSelect.value){

        clearCustomerFields();
        account.innerHTML=
            '<option value="">Select Account</option>';

        return;
    }

    try{

        const c=JSON.parse(
            selected.dataset.customer||"{}"
        );

        fillCustomer(c);

        /*
         Existing customer ki personal/location
         information user manually change nahi karega.
        */
        setCustomerFieldsLocked(true);

        await loadAccounts(customerSelect.value);

    }catch(e){
        showError(e.message);
    }
});

async function findCityLocation(){

    const cityValue=city.value.trim();
    const stateValue=state.value.trim();

    if(!cityValue||!stateValue)return;

    try{

        const res=await fetch("/api/customers");
        const data=await res.json();

        if(!data.success)return;

        const found=data.customers.find(c=>
            String(c.city||"").trim().toLowerCase()===
            cityValue.toLowerCase() &&
            String(c.state||"").trim().toLowerCase()===
            stateValue.toLowerCase()
        );

        if(found){
            zipCode.value=found.zip_code??"";
            latitude.value=found.latitude??"";
            longitude.value=found.longitude??"";
            cityPopulation.value=found.city_population??"";
        }

    }catch(e){
        console.error("City location lookup failed:",e);
    }
}

city.addEventListener("change",()=>{
    if(customerType.value==="new")
        findCityLocation();
});

state.addEventListener("change",()=>{
    if(customerType.value==="new")
        findCityLocation();
});

form.addEventListener("submit",async e=>{

    e.preventDefault();
    clearError();

    if(resultBox)
        resultBox.style.display="none";

    try{

        const type=customerType.value;
        const selectedModel=
            document.querySelector('input[name="model"]:checked');

        if(!type)
            throw new Error("Please select customer type.");

        if(type==="existing"&&!customerSelect.value)
            throw new Error("Please select an existing customer.");

        if(type==="new"&&!newCustomerName.value.trim())
            throw new Error("Please enter customer name.");

        if(!dob.value)
            throw new Error("Please select date of birth.");

        calculateAge();

        const customerAge=Number(age.value);

        if(!Number.isFinite(customerAge)||customerAge<18)
            throw new Error("Customer must be 18 years or above.");

        if(customerAge>120)
            throw new Error("Please enter a valid date of birth.");

        if(!gender.value)
            throw new Error("Please select gender.");

        if(!job.value)
            throw new Error("Please select occupation.");

        if(!state.value.trim())
            throw new Error("Please enter state.");

        if(!city.value.trim())
            throw new Error("Please enter city.");

        if(!zipCode.value)
            throw new Error("Please enter ZIP Code.");

        if(!latitude.value)
            throw new Error("Please enter latitude.");

        if(!longitude.value)
            throw new Error("Please enter longitude.");

        if(!cityPopulation.value)
            throw new Error("Please enter city population.");

        if(!amount.value||Number(amount.value)<=0)
            throw new Error("Please enter a valid amount.");

        if(!transactionType.value)
            throw new Error("Please select transaction type.");

        if(!transactionTime.value)
            throw new Error("Please select transaction date and time.");

        if(type==="existing"&&!account.value)
            throw new Error("Please select an account.");

        if(!merchant.value)
            throw new Error("Please select a merchant.");

        if(!newDevice.value)
            throw new Error("Please select New Device option.");

        if(!international.value)
            throw new Error("Please select International Transaction option.");

        const payload={
            customer_type:type,
            customer_id:
                type==="existing"
                ?Number(customerSelect.value)
                :null,

            customer_name:
                type==="existing"
                ?customerName.value
                :newCustomerName.value.trim(),

            amount:Number(amount.value),
            transaction_type:transactionType.value,
            transaction_time:transactionTime.value,

            dob:dob.value,
            age:customerAge,
            gender:gender.value,
            job:job.value,

            state:state.value.trim(),
            city:city.value.trim(),
            zip_code:Number(zipCode.value),
            latitude:Number(latitude.value),
            longitude:Number(longitude.value),
            city_population:Number(cityPopulation.value),

            account_id:
                type==="existing"
                ?Number(account.value)
                :null,

            device_id:null,

            merchant_id:Number(merchant.value),
            new_device:Number(newDevice.value),
            is_international:Number(international.value),

            model:selectedModel
                ?selectedModel.value
                :"xgboost"
        };

        console.log("Prediction payload:",payload);

        loading.style.display="block";
        predictBtn.disabled=true;

        const res=await fetch("/predict",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(payload)
        });

        const data=await res.json();

        loading.style.display="none";
        predictBtn.disabled=false;

        if(!res.ok||data.success===false)
            throw new Error(
                data.message||"Prediction failed."
            );

        showResult(data);

    }catch(err){

        loading.style.display="none";
        predictBtn.disabled=false;

        showError(err.message);
    }
});

function showResult(data){

    const prediction=
        String(data.prediction||data.result||"")
        .toUpperCase();

    let probability=
        data.fraud_probability_percent;

    if(probability===undefined)
        probability=Number(data.probability||0);

    resultTitle.textContent=
        prediction==="FRAUD"
        ?"⚠️ Fraud Detected"
        :"✓ Transaction Genuine";

    predictionEl.textContent=
        prediction||"UNKNOWN";

    probabilityEl.textContent=
        `${Number(probability).toFixed(2)}%`;

    riskEl.textContent=
        data.risk_level||
        (prediction==="FRAUD"?"HIGH":"LOW");

    modelEl.textContent=
        data.model||"Tuned XGBoost";

    resultMessage.textContent=
        data.message||
        (
            prediction==="FRAUD"
            ?"This transaction has been detected as potentially fraudulent."
            :"This transaction appears to be genuine."
        );

    resultBox.style.display="block";

    resultBox.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });
}

loadCustomers();
loadMerchants();
updateCustomerType();

});