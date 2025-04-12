"use client";

export default function Page() {
  return (
    <form
      className="mx-auto max-w-2xl grid gap-10 my-8 px-8 lg:my-20 text-lg leading-relaxed isolate"
      action={() => {
        window.navigation.navigate("/");
      }}
    >
      <label className="flex flex-col gap-2">
        Email
        <input type="email" className="border rounded p-2" autoFocus />
      </label>
      <label className="flex flex-col gap-2">
        Password
        <input type="password" className="border rounded p-2" />
      </label>
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Sign In
      </button>
    </form>
  );
}
