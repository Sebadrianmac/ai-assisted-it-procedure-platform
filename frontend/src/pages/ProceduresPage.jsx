import { useState, useEffect } from "react";
import axios from "axios";

import Navbar from "./components/Navbar";
import ProcedureItem from "./ProcedureItem";

function ProceduresPage() {
const [procedures, setProcedures] = useState([]);    
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
            console.log("Success procedure come")
        }
    }
    useEffect(()=>{
        getProceduresList();
    },[])


    return (
    <div>
        <Navbar />

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