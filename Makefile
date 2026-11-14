.PHONY: setup dev hooks check fixtures
setup:
	npm run setup
dev:
	npm run dev:all
hooks:
	npm run hooks
check:
	npm run check:fixtures
	npm run check:setup
	npm run check

fixtures:
	npm run fixtures
