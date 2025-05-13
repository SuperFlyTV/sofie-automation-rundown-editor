import type { AnyFieldApi } from '@tanstack/react-form'
import DatePicker, { type DatePickerProps } from 'react-datepicker'

export function FieldInfo({ field }: { field: AnyFieldApi }) {
	return (
		<>
			{field.state.meta.isTouched && !field.state.meta.isValid ? (
				<em>{field.state.meta.errors.join(',')}</em>
			) : null}
			{field.state.meta.isValidating ? 'Validating...' : null}
		</>
	)
}

export function CustomDateTimePicker(props: DatePickerProps) {
	// TODO - styling of this needs some work
	return (
		<DatePicker
			className={`form-control ${props.className ?? ''}`}
			showTimeSelect
			dateFormat="Pp"
			{...props}
		/>
	)
}
