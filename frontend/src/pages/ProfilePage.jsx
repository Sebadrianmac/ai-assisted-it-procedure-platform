const ProfilePage = ({ user }) => {
  if (!user) {
    return (
      <p>Profile information is unavailable.</p>
    );
  }

  return (
    <main className="profile-page">
      <h1>Profile</h1>

      <p>
        <strong>Username:</strong>{" "}
        {user.username}
      </p>

      <p>
        <strong>First name:</strong>{" "}
        {user.first_name || "—"}
      </p>

      <p>
        <strong>Last name:</strong>{" "}
        {user.last_name || "—"}
      </p>

      <p>
        <strong>Email:</strong>{" "}
        {user.email}
      </p>
      <p>
        <strong>Role:</strong>{" "}
        {user.roles}
      </p>

      <p>
        <strong>Date joined:</strong>{" "}
        {user.date_joined
          ? new Date(
              user.date_joined
            ).toLocaleDateString()
          : "—"}
      </p>
    </main>
  );
};


export default ProfilePage;