export default function Admin() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="text-muted-foreground mt-1">Manage users, moderate posts, verify donors, and view analytics.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4">Users</div>
        <div className="rounded-xl border p-4">Posts</div>
        <div className="rounded-xl border p-4">Requests</div>
      </div>
      <div className="mt-6 rounded-xl border p-6">Daily activity chart goes here.</div>
    </div>
  );
}
