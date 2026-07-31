import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import ProcedureItem from "./ProcedureItem";

const ProceduresPage = () => {
  const [procedures, setProcedures] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProcedures = async () => {
      const accessToken = localStorage.getItem("access");

      const response = await fetch(
        "http://127.0.0.1:8000/api/procedures/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProcedures(data);
      } else if (response.status === 401) {
        setError("You need to log in.");
      } else if (response.status === 403) {
        setError("You do not have permission.");
      }
    };

    loadProcedures();
  }, []);

  if (error) {
    return <p>{error}</p>;
  }


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