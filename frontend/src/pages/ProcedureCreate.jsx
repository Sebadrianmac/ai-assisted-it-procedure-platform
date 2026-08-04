import { useState } from "react";
import ProcedureInfoForm from "../procedure/ProcedureInfoForm";
import ProcedureStepsForm from "../procedure/ProcedureStepsForm";
import { useNavigate } from "react-router-dom";

import "../../styles/ProcedureCreate.css";

const ProcedureCreate = () => {
    const [formStep, setFormStep] = useState(1);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState([]);

    const navigate = useNavigate();

    const handleCreate = async () => {
        const access = localStorage.getItem("access");
        
        const procedureData = {
            title: title.trim(),
            description: description.trim(),
            steps
        };

        try{
            const response = await fetch(
                "http://127.0.0.1:8000/api/procedures/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${access}`
                    },
                    body: JSON.stringify(
                        procedureData
                    ),
                }
            );

            const data = await response.json();

            if(!response.ok){
                console.error(data)
                return;
            }

            console.log(
                "Created procedure",
                data
            );
        navigate("/procedures");


        }catch(error){
            console.error(
                "Server connection error:",
                error
            );
        }
    }

    return (
    <main className="procedure-create">
        {formStep === 1 && (
        <ProcedureInfoForm
            title={title}
            description={description}
            setTitle={setTitle}
            setDescription={setDescription}
            onContinue={() => setFormStep(2)}
        />
        )}

        {formStep === 2 && (
        <ProcedureStepsForm
            title={title}
            description={description}
            steps={steps}
            setSteps={setSteps}
            onBack={() => setFormStep(1)}
            onCreate={handleCreate}
        />
        )}
    </main>
    );
    
}
export default ProcedureCreate