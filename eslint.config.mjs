// @ts-check
import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'

export default typescriptEslint.config(
	{ ignores: ['*.d.ts', '**/coverage', '**/dist', '**/dist_electron'] },
	{
		extends: [
			eslint.configs.recommended,
			...typescriptEslint.configs.recommended,
			...eslintPluginVue.configs['flat/vue2-recommended']
		],
		files: ['**/*.{ts,vue}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.browser,
			parserOptions: {
				parser: typescriptEslint.parser
			}
		},
		rules: {
			// your rules
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/interface-name-prefix': 'off'
			// '@typescript-eslint/no-unused-vars': [
			// 	'error',
			// 	{ argsIgnorePattern: '^_', varsIgnorePattern: '^_(.+)', caughtErrorsIgnorePattern: '^_' }
			// ],
			// '@typescript-eslint/no-floating-promises': 'error',
			// '@typescript-eslint/explicit-module-boundary-types': ['error'],
			// '@typescript-eslint/promise-function-async': 'error',
			// '@typescript-eslint/require-await': 'off', // conflicts with 'promise-function-async'
			// '@typescript-eslint/no-duplicate-enum-values': 'error'
		}
	},
	eslintConfigPrettier
)

// // @ts-check
// import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
// import eslint from '@eslint/js'
// import neslint from 'eslint-plugin-n'
// import tseslint from 'typescript-eslint'
// import sofiePlugin from '@sofie-automation/eslint-plugin'
// import pluginVue from 'eslint-plugin-vue'
// import vueParser from 'vue-eslint-parser'

// /**
//  *
//  * @template T
//  * @param {Record<string, T | null | undefined>} obj
//  * @returns {Record<string, T>}
//  */
// function compactObj(obj) {
// 	/** @type {Record<string, T>} */
// 	const result = {}

// 	for (const [key, value] of Object.entries(obj)) {
// 		if (value) result[key] = value
// 	}

// 	return result
// }

// export default [
// 	{
// 		// Setup the parser for js/ts
// 		languageOptions: {
// 			parser: vueParser,
// 			parserOptions: {
// 				parser: tseslint.parser,
// 				parserOptions: {
// 					project: true
// 				}
// 			}
// 		}
// 	},

// 	...tseslint.configs.recommendedTypeChecked.map((conf) => ({
// 		...conf,
// 		// Only apply these rules to TypeScript files
// 		files: ['**/*.ts', '**/*.cts', '**/*.mts', '**/*.tsx']
// 	})),
// 	{
// 		// Disable type-aware linting on JS files
// 		files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.jsx'],
// 		...tseslint.configs.disableTypeChecked,
// 		rules: {
// 			...tseslint.configs.disableTypeChecked.rules,
// 			'no-unused-vars': [
// 				'error',
// 				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_(.+)', caughtErrorsIgnorePattern: '^_' }
// 			]
// 		}
// 	},

// 	...pluginVue.configs['flat/vue2-recommended'], // Use this if you are using Vue.js 2.x.

// 	// !options.disableNodeRules
// 	// 	?
// 	{
// 		...neslint.configs['flat/recommended-script'],
// 		rules: {
// 			...neslint.configs['flat/recommended-script'].rules,

// 			'n/file-extension-in-import': 'error'
// 		}
// 	},
// 	// : undefined,

// 	{
// 		settings: {
// 			n: {
// 				tryExtensions: [
// 					'.js',
// 					'.cjs',
// 					'.mjs',
// 					'.json',
// 					'.node',
// 					'.ts',
// 					'.cts',
// 					'.mts',
// 					'.d.ts',
// 					'.tsx',
// 					'.vue'
// 				]
// 			}
// 		},
// 		// extends: commonExtends,
// 		plugins: compactObj({
// 			'@typescript-eslint': tseslint.plugin,
// 			'@sofie-automation': sofiePlugin
// 		}),
// 		rules: {
// 			// Default rules to be applied everywhere
// 			'prettier/prettier': 'error',

// 			...eslint.configs.recommended.rules,

// 			'no-extra-semi': 'off',
// 			// 'n/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
// 			'no-use-before-define': 'off',
// 			'no-warning-comments': ['error', { terms: ['nocommit', '@nocommit', '@no-commit'] }]
// 			// 'jest/no-mocks-import': 'off',
// 		}
// 	},

// 	{
// 		files: ['**/*.vue'],
// 		plugins: {
// 			// vue: pluginVue.
// 		},
// 		rules: {
// 			// override/add rules settings here, such as:
// 			// 'vue/no-unused-vars': 'error'
// 		},
// 		languageOptions: {
// 			sourceType: 'module',
// 			// parserOptions: {
// 			// 	parser: tseslint.parser
// 			// },
// 			globals: {
// 				// ...globals.browser
// 			}
// 		}
// 	},

// 	{
// 		files: ['**/*.ts', '**/*.cts', '**/*.mts', '**/*.tsx'],
// 		rules: {
// 			// These clash with ts rules
// 			'no-unused-vars': 'off',
// 			'no-redeclare': 'off',
// 			'no-undef': 'off',
// 			'no-dupe-class-members': 'off',

// 			...sofiePlugin.configs.all.rules,

// 			// Custom rules
// 			'@typescript-eslint/no-explicit-any': 'off',
// 			'@typescript-eslint/interface-name-prefix': 'off',
// 			'@typescript-eslint/no-unused-vars': [
// 				'error',
// 				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_(.+)', caughtErrorsIgnorePattern: '^_' }
// 			],
// 			'@typescript-eslint/no-floating-promises': 'error',
// 			'@typescript-eslint/explicit-module-boundary-types': ['error'],
// 			'@typescript-eslint/promise-function-async': 'error',
// 			'@typescript-eslint/require-await': 'off', // conflicts with 'promise-function-async'
// 			'@typescript-eslint/no-duplicate-enum-values': 'error',
// 			'@typescript-eslint/no-require-imports': [
// 				'error',
// 				{
// 					allow: ['\\.json$']
// 					// allowAsImport: true,
// 				}
// 			],

// 			// Enable a few rules from the strict pack
// 			'@typescript-eslint/no-non-null-assertion': 'error',

// 			/** Disable some annoyingly strict rules from the 'recommended-requiring-type-checking' pack */
// 			'@typescript-eslint/no-unsafe-assignment': 0,
// 			'@typescript-eslint/no-unsafe-member-access': 0,
// 			'@typescript-eslint/no-unsafe-argument': 0,
// 			'@typescript-eslint/no-unsafe-return': 0,
// 			'@typescript-eslint/no-unsafe-call': 0,
// 			'@typescript-eslint/restrict-template-expressions': 0,
// 			'@typescript-eslint/restrict-plus-operands': 0,
// 			'@typescript-eslint/no-redundant-type-constituents': 0
// 			/** End 'recommended-requiring-type-checking' overrides */
// 		}
// 	},
// 	{
// 		files: ['**/__tests__/**/*', 'test/**/*'],
// 		rules: {
// 			'@typescript-eslint/ban-ts-ignore': 'off',
// 			'@typescript-eslint/ban-ts-comment': 'off'
// 		}
// 	},
// 	// !options.disableNodeRules
// 	// 	? {
// 	// 			files: ['**/__tests__/**/*', 'test/**/*'],
// 	// 			rules: {
// 	// 				'n/no-unpublished-import': [
// 	// 					'error',
// 	// 					{
// 	// 						allowModules: [
// 	// 							'jest-mock-extended',
// 	// 							'type-fest',
// 	// 							'@testing-library/jest-dom',
// 	// 							'@testing-library/react',
// 	// 							'@testing-library/user-event'
// 	// 						]
// 	// 					}
// 	// 				],
// 	// 				'n/no-extraneous-import': [
// 	// 					'error',
// 	// 					{
// 	// 						allowModules: ['jest-mock-extended']
// 	// 					}
// 	// 				]
// 	// 			}
// 	// 		}
// 	// 	: null,

// 	// !options.disableNodeRules
// 	// 	? {
// 	// 			files: ['eslint.config.*'],
// 	// 			rules: {
// 	// 				'n/no-extraneous-import': 'off'
// 	// 			}
// 	// 		}
// 	// 	: null,

// 	// Add prettier at the end to give it final say on formatting
// 	eslintPluginPrettierRecommended,
// 	{
// 		// But lastly, ensure that we ignore certain paths
// 		ignores: [
// 			'.yarn/*',
// 			'**/dist/*',
// 			'**/dist_electron/*',
// 			'**/coverage/*',
// 			'**/scratch/*',
// 			'/dist',
// 			'**/docs/*',
// 			'**/generated/*'
// 		]
// 	}
// ].filter((v) => !!v)
