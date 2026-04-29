import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
      <span className="font-black text-lg tracking-tight">⚡ 个人面板</span>
      <div className="flex gap-4 text-sm text-gray-500">
        <Link href="/" className="font-medium text-black">首页</Link>
        <Link href="/hardwork" className="hover:text-black transition-colors">苦功夫</Link>
        <Link href="/jobs" className="hover:text-black transition-colors">求职</Link>
        <Link href="/coding" className="hover:text-black transition-colors">刷题</Link>
        <Link href="/health" className="hover:text-black transition-colors">健康</Link>
        <Link href="/sculpt" className="hover:text-black transition-colors">塑型</Link>
        <Link href="/library" className="hover:text-black transition-colors">图书馆</Link>
        <Link href="/profile" className="hover:text-black transition-colors">档案</Link>
      </div>
    </nav>
  )
}
