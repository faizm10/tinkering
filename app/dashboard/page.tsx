import { FlightAirport } from "@/components/ui/flight"
import { Map } from "@/components/ui/map"
import React from "react"

const AdminDashboard = () => {
  return

  ;<>
    <Map center={[128, 29]} zoom={2.35}>
      <FlightAirport code="TPE" showLabel={true} labelPosition="top" />
      <FlightAirport code="HND" showLabel={true} labelPosition="top" />
      <FlightAirport code="ICN" showLabel={true} labelPosition="top" />
    </Map>
  </>
}

export default AdminDashboard
