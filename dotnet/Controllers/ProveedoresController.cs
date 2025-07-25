using Microsoft.AspNetCore.Mvc;
using Api.Repositories.Interfaces;
using Api.Models.ViewModels;


namespace Api.Controllers
{
    [ApiController]
    [Route("api/proveedores")]
    // [Authorize]
    public class ProveedoresController : ControllerBase
    {
        private readonly IProveedoresRepository _proveedoresRepository;

        public ProveedoresController(IProveedoresRepository proveedoresRepository)
        {
            _proveedoresRepository = proveedoresRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProveedorViewModel>>> GetProveedores(
            [FromQuery] string? busqueda
        )
        {
            var proveedores = await _proveedoresRepository.GetProveedores(busqueda);
            return Ok(proveedores);
        }

        [HttpGet("reporte")]
        public async Task<ActionResult<IEnumerable<ReporteProveedores>>> GetReporteProveedores(
            [FromQuery] string? fechaDesde,
            [FromQuery] string? fechaHasta,
            [FromQuery] uint? proveedor,
            [FromQuery] uint? cliente
        )
        {
            var reporte = await _proveedoresRepository.GetReporteProveedores(fechaDesde, fechaHasta, proveedor, cliente);
            return Ok(reporte);
        }
    }
}
