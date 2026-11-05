import { Select } from '../../components/ui/Select'
import { useCurrentInstance, useWorkspace } from '../../state/WorkspaceProvider'
export function InstancePicker() {
  const { state, dispatch } = useWorkspace()
  const current = useCurrentInstance()
  return (
    <Select
      label="当前实例"
      value={current.name}
      options={state.instances.map((instance) => instance.name)}
      onChange={(name) => {
        const instance = state.instances.find(
          (instance) => instance.name === name,
        )!
        dispatch({ type: 'instance/select', id: instance.id })
      }}
    />
  )
}
