export function AppSidebar() {
  return (
    <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col items-center py-8">
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold italic shadow-lg shadow-indigo-600/20">
        PC
      </div>
      <nav className="flex-1 mt-12 w-full px-6 space-y-4 text-zinc-400 font-medium">
        <div className="p-3 rounded-lg bg-zinc-900 text-indigo-400 border border-zinc-800 shadow-sm transition-all active:scale-95 cursor-pointer">
          Dashboard
        </div>
        <div className="p-3 rounded-lg hover:bg-zinc-900 hover:text-zinc-100 transition-all active:scale-95 cursor-pointer border border-transparent hover:border-zinc-800">
          Messages
        </div>
        <div className="p-3 rounded-lg hover:bg-zinc-900 hover:text-zinc-100 transition-all active:scale-95 cursor-pointer border border-transparent hover:border-zinc-800">
          Contacts
        </div>
        <div className="p-3 rounded-lg hover:bg-zinc-900 hover:text-zinc-100 transition-all active:scale-95 cursor-pointer border border-transparent hover:border-zinc-800">
          Settings
        </div>
      </nav>
    </aside>
  )
}
