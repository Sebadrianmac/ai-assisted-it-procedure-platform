const Can = ({
  permission,
  permissions = [],
  children,
  fallback = null,
}) => {
  if (!permissions.includes(permission)) {
    return fallback;
  }

  return children;
};


export default Can;