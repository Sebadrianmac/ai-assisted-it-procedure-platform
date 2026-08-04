const ProcedureInfoForm = ({
    title,
    setTitle,
    description,
    setDescription,
    onContinue,
}) => {
    const handleSubmit= (event) => {
        event.preventDefault();

        if(!title.trim()){
            return;
        }
        onContinue();
    }
    return (
    <section className="procedure-info-form">
        <header>
        <h1>Create procedure</h1>
        <p>
            Enter the basic procedure information.
        </p>
        </header>

        <form onSubmit={handleSubmit}>
        <div className="form-field">
            <label htmlFor="title">
            Title
            </label>

            <input
            type="text"
            name="title"
            id="title"
            value={title}
            placeholder="Procedure title"
            onChange={(event) =>
                setTitle(event.target.value)
            }
            />
        </div>

        <div className="form-field">
            <label htmlFor="description">
            Description
            </label>

            <textarea
            name="description"
            id="description"
            value={description}
            placeholder="Procedure description"
            onChange={(event) =>
                setDescription(
                event.target.value
                )
            }
            />
        </div>

        <button type="submit">
            Continue
        </button>
        </form>
    </section>
    );
    
}
export default ProcedureInfoForm
