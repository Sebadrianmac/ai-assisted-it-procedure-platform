const ProcedureReviewComment = ({ version }) => {
  const reviewerName = [
    version.reviewed_by?.first_name,
    version.reviewed_by?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="procedure-review-comment">
      <h2>Changes requested</h2>

      <p>{version.review_comment}</p>

      {version.reviewed_by && (
        <p className="reviewed-by">
          Reviewed by:{" "}
          {reviewerName ||
            version.reviewed_by.username ||
            "Unknown"}
        </p>
      )}
    </section>
  );
};

export default ProcedureReviewComment;