export type LocationPickerContextMarker =
  | {
      kind: "departure"
      latitude: number
      longitude: number
    }
  | {
      kind: "enigma"
      id: string
      number: number
      name: string
      latitude: number
      longitude: number
    }
  | {
      kind: "treasure"
      name: string
      latitude: number
      longitude: number
    }
