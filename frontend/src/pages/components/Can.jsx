const Can = ({
  permission,
  permissions,
  children,
}) => {
  if (!permissions.includes(permission)) {
    return null;
  }

  return children;
};

export default Can;