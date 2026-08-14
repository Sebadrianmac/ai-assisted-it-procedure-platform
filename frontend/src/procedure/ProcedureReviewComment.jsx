const ProcedureReviewComment = ({
  version,
}) => {
  return (
    <section className="procedure-review-comment">
      <h2>Changes requested</h2>

      <p>{version.review_comment}</p>

      {version.reviewed_by && (
        <p>
          Reviewed by:{" "}
          {version.reviewed_by.first_name}{" "}
          {version.reviewed_by.last_name}
        </p>
      )}
    </section>
  );
};
export default ProcedureReviewComment