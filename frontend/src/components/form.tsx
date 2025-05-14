import type { AnyFieldApi } from '@tanstack/react-form'
import DatePicker, { type DatePickerProps } from 'react-datepicker'
import './form.scss'

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
	return (
		<div className="form-control-datepicker">
			<DatePicker
				className={`form-control ${props.className ?? ''}`}
				showTimeSelect
				dateFormat="Pp"
				{...props}
			/>
		</div>
	)
}
