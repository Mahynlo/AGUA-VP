import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const PermissionsContext = createContext(null);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions debe usarse dentro de PermissionsProvider");
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const refreshPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions([]);
      return;
    }

    setLoadingPermissions(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setPermissions([]);
        return;
      }

      const result = await window.api.fetchMyPermissions(token);
      const snapshot = Array.isArray(result?.permissions) ? result.permissions : [];
      setPermissions(snapshot);
    } catch (error) {
      console.error("Error loading user permissions:", error);
      setPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const grantedSet = useMemo(() => {
    const set = new Set();

    permissions.forEach((permission) => {
      if (permission?.granted) {
        set.add(permission.key);
      }
    });

    return set;
  }, [permissions]);

  const can = useCallback(
    (permissionKey) => {
      if (!permissionKey) return false;
      if (!user) return false;
      if (user.rol === "superadmin") return true;
      return grantedSet.has(permissionKey);
    },
    [grantedSet, user]
  );

  const value = useMemo(
    () => ({
      permissions,
      loadingPermissions,
      refreshPermissions,
      can
    }),
    [permissions, loadingPermissions, refreshPermissions, can]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};
