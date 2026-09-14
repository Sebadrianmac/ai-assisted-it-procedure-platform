import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  SendHorizontal,
  Loader,
} from "lucide-react";

const AiProcedureHelper = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amountSteps, setAmountSteps] = useState(5);
  const [instructions, setInstructions] = useState("");

  const navigation = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingError, setGeneratingError] = useState("");

  const [additionalInfoForm, setAdditionalInfoForm] = useState(false);
  const handleGenerate = async (event) => {
    event.preventDefault();

    if (!instructions.trim()) {
      setGeneratingError("Describe the procedure you want to create.");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratingError("");

      const response = await api.post("api/ai/generate-procedure/", {
        title: additionalInfoForm ? title.trim() : "",
        description: additionalInfoForm ? description.trim() : "",
        amountSteps: additionalInfoForm ? amountSteps : null,
        instructions: instructions.trim(),
      });

      const procedure = response.data.procedure;

      navigation("/procedure/create", {
        state: {
          generatedProcedure: procedure,
        },
      });
    } catch (error) {
      console.error("Failed to generate procedure:", error);

      setGeneratingError(
        error.response?.data?.detail || "Failed to generate procedure.",
      );
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <form onSubmit={handleGenerate} className="ai-procedure-helper">
      <div className="ai-helper-header">
        <div>
          <h2>AI Procedure Assistant</h2>{" "}
          <div className="ai-helper-icon">
            <Bot size={25} />
          </div>
        </div>
      </div>
      {additionalInfoForm && (
        <>
            <p>Describe what you want to create.</p>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title..."
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descriptions..."
            rows={1}
          />
          <div className="steps-amount-control">
            <div className="steps-amount-header">
              <label htmlFor="steps-range">Number of steps</label>

              <span>{amountSteps} steps</span>
            </div>

            <div className="steps-amount-inputs">
              <input
                id="steps-range"
                className="steps-slider"
                type="range"
                min="3"
                max="10"
                step="1"
                value={amountSteps}
                onChange={(event) => {
                  setAmountSteps(Number(event.target.value));
                }}
              />

              <input
                className="steps-number-input"
                type="number"
                min="3"
                max="10"
                value={amountSteps}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (value >= 3 && value <= 10) {
                    setAmountSteps(value);
                  }
                }}
                aria-label="Number of procedure steps"
              />
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        className="additional-info-button"
        onClick={() => {
          setAdditionalInfoForm((currentValue) => !currentValue);
        }}
        aria-expanded={additionalInfoForm}
      >
        {additionalInfoForm ? (
          <ChevronUp size={15} />
        ) : (
          <ChevronDown size={15} />
        )}
      </button>
      <div className="form-ai-procedure__submit">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Describe the procedure you want to create"
          rows={2}
        />
        <button type="submit" disabled={isGenerating}>
          {!isGenerating ? <SendHorizontal /> : <Loader />}
        </button>
      </div>
    </form>
  );
};
export default AiProcedureHelper;
