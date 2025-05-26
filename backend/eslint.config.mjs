import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default [
	...tseslint.config(
		{ ignores: ['dist'] },
		{
			extends: [js.configs.recommended, ...tseslint.configs.recommended],
			files: ['**/*.{ts}'],
			languageOptions: {
				ecmaVersion: 2020
			}
		}
	),
	eslintConfigPrettier
]
