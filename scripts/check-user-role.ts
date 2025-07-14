import { prisma } from '../src/lib/db'

async function main() {
  const email = 'ivanalex.gp35@gmail.com'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log('Usuario no encontrado')
    process.exit(1)
  }
  console.log(`Usuario: ${user.email} | Rol: ${user.role}`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) }) 