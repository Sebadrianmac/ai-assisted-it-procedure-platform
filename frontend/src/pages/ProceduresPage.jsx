import { useEffect, useState } from "react";

import ProcedureItem from "./ProcedureItem";

const ProceduresPage = (props) => {
  const {
        permissions=[],
    } =props
  const [procedures, setProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  
  
  useEffect(() => {
    const controller = new AbortController();

    const loadProcedures = async () => {
      try {
        const accessToken = localStorage.getItem("access");

        setIsLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/api/procedures/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          throw new Error(
            "You need to log in."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view procedures."
          );
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load procedures."
          );
        }

        const data = await response.json();

        setProcedures(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProcedures();

    return () => {
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return <p>Loading procedures...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

console.log(
  "ProceduresPage permissions:",
  permissions
);

  return (
    <main>
      <header>
        <h1>Procedures</h1>
        <p>Manage IT procedures</p>
      </header>

      {procedures.length === 0 ? (
        <p>No procedures found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Procedure</th>
              <th>Created by</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {procedures.map((procedure) => (
              <ProcedureItem
                procedure={procedure}
                permissions={permissions}
              />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};


export default ProceduresPage;