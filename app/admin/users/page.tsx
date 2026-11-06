
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  user_id: number;
  name: string;
  email: string;
  role: "admin" | "researcher";
  created_at: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<
    Record<number, "admin" | "researcher">
  >({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, meResponse] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      if (usersResponse.status === 401 || meResponse.status === 401) {
        throw new Error("Please log in to continue.");
      }

      if (usersResponse.status === 403) {
        throw new Error("Administrator access is required.");
      }

      if (!usersResponse.ok || !meResponse.ok) {
        throw new Error("Could not retrieve account information.");
      }

      const usersData = await usersResponse.json();
      const meData = await meResponse.json();
      const currentUser = meData.user ?? meData;

      setUsers(usersData.users);
      setCurrentUserId(Number(currentUser.user_id));

      const roles: Record<number, "admin" | "researcher"> = {};

      for (const user of usersData.users as User[]) {
        roles[user.user_id] = user.role;
      }

      setSelectedRoles(roles);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(user: User) {
    const newRole = selectedRoles[user.user_id];

    if (newRole === user.role) {
      setMessage("No changes to save.");
      return;
    }

    setUpdatingUserId(user.user_id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${user.user_id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update user role.");
      }

      setMessage(`${user.name}'s role was updated successfully.`);
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Role update failed."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Research<span className="text-indigo-600">Lens</span>
            </Link>
            <p className="mt-1 text-sm text-slate-500">
              Administration Portal
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">User Management</h1>
            <p className="mt-2 text-slate-500">
              View registered accounts and manage user roles.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            ↻ Refresh Users
          </button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Registered Users</p>
            <p className="mt-3 text-3xl font-bold">{users.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Administrators</p>
            <p className="mt-3 text-3xl font-bold">
              {users.filter((user) => user.role === "admin").length}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold">Registered Accounts</h2>
              <p className="mt-1 text-sm text-slate-500">
                User details retrieved directly from PostgreSQL.
              </p>
            </div>

            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {users.length} users
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading users...
            </div>
          ) : error && users.length === 0 ? (
            <div className="p-8 text-center text-red-600">
              <p className="font-semibold">{error}</p>
              <button
                onClick={loadUsers}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No registered users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4">Manage Role</th>
                    <th className="px-6 py-4">Registered On</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const isCurrentUser = user.user_id === currentUserId;
                    const isUpdating = updatingUserId === user.user_id;

                    return (
                      <tr key={user.user_id} className="hover:bg-slate-50">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                              {user.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                ID: {user.user_id}
                                {isCurrentUser && " · You"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-slate-600">
                          {user.email}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {user.role === "admin"
                              ? "Administrator"
                              : "Researcher"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {isCurrentUser ? (
                            <span className="text-xs text-slate-400">
                              Your role cannot be changed
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={
                                  selectedRoles[user.user_id] ?? user.role
                                }
                                disabled={isUpdating || updatingUserId !== null}
                                onChange={(event) =>
                                  setSelectedRoles((previous) => ({
                                    ...previous,
                                    [user.user_id]: event.target.value as
                                      | "admin"
                                      | "researcher",
                                  }))
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
                              >
                                <option value="researcher">Researcher</option>
                                <option value="admin">Administrator</option>
                              </select>

                              <button
                                onClick={() => updateRole(user)}
                                disabled={
                                  isUpdating ||
                                  updatingUserId !== null ||
                                  selectedRoles[user.user_id] === user.role
                                }
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isUpdating ? "Saving..." : "Save"}
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5 text-slate-500">
                          {new Date(user.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-sm text-slate-400">
          ResearchLens · User Management
        </footer>
      </section>
    </main>
  );
}

