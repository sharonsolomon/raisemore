.DEFAULT_GOAL := reset

reset: dockerfix stop start dev

dockerfix:
	sudo ln -s ~/.docker/run/docker.sock /var/run/docker.sock || true

start:
	supabase start --exclude gotrue,imgproxy,pgadmin-schema-diff,migra,deno-relay,inbucket
	npm run migrate
	pm2 start "ngrok http --domain=dev.raisemore.app 3000"

dev:
	npm run dev

stop:
	supabase stop
	pkill node || true
	pm2 delete all || true

nuke: stop

lint:
	npm run lint

test: quickwithoutdev runtest

runtest:
	npm run test

newtest:
	npx playwright codegen --load-storage=__e2e__/.auth/user.json localhost:3000

debugtests: stop start runtestdebugandstop

quickwithoutdev:
	psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	psql "postgresql://postgres:postgres@localhost:54322/postgres" -f ./supabase/seed.sql
	npm run migrate

quick: quickwithoutdev dev