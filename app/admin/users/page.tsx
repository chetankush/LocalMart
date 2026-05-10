"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Search,
  Loader2,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react";

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; vendors: number };
}

const roleBadge: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-800",
  VENDOR: "bg-purple-100 text-purple-800",
  ADMIN: "bg-red-100 text-red-800",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import("@/lib/api/client");
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const result = await apiClient.get<any>(`/admin/users?${params}`);
      setUsers(result.data?.users || []);
      setTotalPages(result.data?.pagination?.totalPages || 1);
      setTotal(result.data?.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    try {
      setUpdatingId(userId);
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/admin/users/${userId}`, {
        isActive: !currentlyActive,
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;
    try {
      setUpdatingId(userId);
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/admin/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("Failed to change role:", error);
      alert("Failed to change role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">{total} total users</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                Search
              </button>
            </form>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="VENDOR">Vendor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Orders</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Stores</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Joined</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className={!user.isActive ? "bg-red-50/50" : ""}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-gray-500 text-xs">{user.email || user.phone || "No contact"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge[user.role] || "bg-gray-100 text-gray-800"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 text-green-700 text-xs">
                              <UserCheck className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 text-xs">
                              <UserX className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{user._count.orders}</td>
                        <td className="px-4 py-3 text-gray-600">{user._count.vendors}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              disabled={updatingId === user.id}
                              title={user.isActive ? "Deactivate" : "Activate"}
                              className={`p-1.5 rounded-lg text-xs cursor-pointer disabled:opacity-50 ${
                                user.isActive
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                            >
                              {user.isActive ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </button>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={updatingId === user.id}
                              className="text-xs border rounded px-1.5 py-1 disabled:opacity-50"
                            >
                              <option value="CUSTOMER">Customer</option>
                              <option value="VENDOR">Vendor</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            {updatingId === user.id && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
