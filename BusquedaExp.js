import React, { Component, Fragment } from 'react';

class BusquedaExp extends Component {

	state= {
		numExpediente:''
	}
	
	render() {
	
		return (
		
			<Fragment>
			
				<div className="row justify-content-left">

					<form className="col-md-12 m-3">

						<div className="form-row">

							<div className="form-group col-md-3">
                                <label>No. Expediente:</label>
								<input type="text" 
									className="form-control" 
									placeholder="No. Expediente" 
									onChange={e => {
										this.setState({
												...this.state,
												numExpediente: e.target.value
										})
									}} 
								/>						
							</div>
							<div className="form-group col-md-3 d-flex d-flex align-items-end justify-content-center">
								<button type="button" 
									className="btn btn-success mr-md-2 mb-2 mb-md-0 botonGuardar"
									onClick={e => this.props.buscarExp(this.state.numExpediente)}>
									Buscar
								</button>						
							</div>						
						</div>						
					</form>
				</div>				
			</Fragment>
		);
	}
}

export default BusquedaExp;