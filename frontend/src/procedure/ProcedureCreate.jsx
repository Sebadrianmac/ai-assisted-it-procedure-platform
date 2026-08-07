import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import ProcedureInfoForm from "./ProcedureInfoForm";
import ProcedureStepsForm from "./ProcedureStepsForm";

import "../../styles/ProcedureCreate.css";


const ProcedureCreate = () => {
  const [formStep, setFormStep] =useState(1);
  const [title, setTitle] =useState("");
  const [description, setDescription] =useState("");
  const [steps, setSteps] =useState([]);
  const [error, setError] =useState("");
  const [isCreating, setIsCreating] =useState(false);
  
  const navigate = useNavigate();
  const handleCreate = async () => {
    const procedureData = {
      title: title.trim(),
      description: description.trim(),
      steps,
    };

    try {
      setIsCreating(true);
      setError("");

      const response = await api.post(
        "/api/procedures/",
        procedureData
      );

      console.log(
        "Created procedure:",
        response.data
      );

      navigate("/procedures");
    } catch (error) {
      console.error(
        "Procedure creation error:",
        error
      );

      const status =
        error.response?.status;

      const backendData =
        error.response?.data;

      if (status === 401) {
        setError(
          "Your session has expired."
        );
      } else if (status === 403) {
        setError(
          "You do not have permission "
          + "to create procedures."
        );
      } else if (status === 400) {
        setError(
          backendData?.title ||
          backendData?.description ||
          backendData?.steps ||
          "Invalid procedure data."
        );
      } else {
        setError(
          "Failed to create procedure."
        );
      }
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <main className="procedure-create">
      {formStep === 1 && (
        <ProcedureInfoForm
          title={title}
          description={description}
          setTitle={setTitle}
          setDescription={setDescription}
          onContinue={() =>
            setFormStep(2)
          }
        />
      )}

      {formStep === 2 && (
        <>
          <ProcedureStepsForm
            title={title}
            description={description}
            steps={steps}
            setSteps={setSteps}
            onBack={() =>
              setFormStep(1)
            }
            onCreate={handleCreate}
            isCreating={isCreating}
          />

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}
        </>
      )}
    </main>
  );
};


export default ProcedureCreate;