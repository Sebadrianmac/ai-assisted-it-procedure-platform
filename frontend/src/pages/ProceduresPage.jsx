import { useState, useEffect } from "react";
import ProcedureItem from "./ProcedureItem";
import axios from "axios";
function ProceduresPage() {
const [procedures, setProcedures] = useState([
    { id: 1, title: "Reset password" },
    { id: 2, title: "Configure VPN" },
    { id: 3, title: "Create employee account" }
]);    
    let getProceduresList = async () => {
        const access = localStorage.getItem("access");
        const responce = await axios.get(
            'http://127.0.0.1:8000/api/procedures',
            {
                headers: {
                    Authorization : `Bearer ${access}`
                }
            }
        );
        
        if(responce.status === 200){
            let data = responce.data;
            setProcedures(data);
        }
    }
    useEffect(()=>{
        getProceduresList();
    },[])


    return (
    <div>
        <ul>
            {procedures.map((procedure)=>(
            <ProcedureItem
            key={procedure.id}
            id={procedure.id}
            title={procedure.title}
            />  
            )
            )}
        </ul>
    </div>
  );
}

export default ProceduresPage;