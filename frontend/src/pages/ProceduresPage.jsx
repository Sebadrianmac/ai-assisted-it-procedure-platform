import {useEffect,useState,} from "react";

import api from "../api/api";
import ProcedureItem from "./ProcedureItem";

const ProceduresPage = ({
  permissions = [],
}) => {
  const [procedures, setProcedures] =useState([]);
  const [isLoading, setIsLoading] =useState(true);
  const [error, setError] =useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProcedures = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get(
          "/api/procedures/",
          {
            signal: controller.signal,
          }
        );

        setProcedures(response.data);
      } catch (error) {
 
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const status =
          error.response?.status;

        if (status === 401) {
          setError(
            "You need to log in."
          );
        } else if (status === 403) {
          setError(
            "You do not have permission "
            + "to view procedures."
          );
        } else {
          setError(
            "Failed to load procedures."
          );
        }

        console.error(
          "Failed to load procedures:",
          error
        );
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
    return (
      <p>Loading procedures...</p>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

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
            {procedures.map(
              (procedure) => (
                <ProcedureItem
                  key={procedure.id}
                  procedure={procedure}
                  permissions={
                    permissions
                  }
                />
              )
            )}
          </tbody>
        </table>
      )}
    </main>
  );
};


export default ProceduresPage;