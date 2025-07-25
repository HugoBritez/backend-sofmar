using Api.Models.Entities;
using Api.Repositories.Interfaces;
using Api.Services.Interfaces;
using Api.Audit.Services;
using Api.Models.ViewModels;
using Api.Auth.Services;
using Api.Auth.Models;
namespace Api.Services.Implementations
{
    public class PedidoService : IPedidosService
    {
        private readonly IPedidosRepository _pedidoRepository;
        private readonly IDetallePedidoRepository _detallePedidoRepository;
        private readonly IDetallePedidoFaltanteRepository _detallePedidoFaltanteRepository;
        private readonly IAuditoriaService _auditoriaService;
        private readonly IArticuloLoteRepository _articuloLoteRepository;
        private readonly IAreaSecuenciaRepository _areaSecuenciaRepository;
        private readonly IPedidoEstadoRepository _pedidoEstadoRepository;

        private readonly IClienteRepository _clienteRepository;

        private readonly IAuthService _authService;

        public PedidoService(
            IPedidosRepository pedidosRepository,
            IDetallePedidoRepository detallePedidoRepository,
            IDetallePedidoFaltanteRepository detallePedidoFaltanteRepository,
            IAuditoriaService auditoriaService,
            IArticuloLoteRepository articuloLoteRepository,
            IAreaSecuenciaRepository areaSecuenciaRepository,
            IPedidoEstadoRepository pedidoEstadoRepository,
            IAuthService authService,
            IClienteRepository clienteRepository
        )
        {
            _pedidoRepository = pedidosRepository;
            _detallePedidoRepository = detallePedidoRepository;
            _detallePedidoFaltanteRepository = detallePedidoFaltanteRepository;
            _auditoriaService = auditoriaService;
            _articuloLoteRepository = articuloLoteRepository;
            _areaSecuenciaRepository = areaSecuenciaRepository;
            _pedidoEstadoRepository = pedidoEstadoRepository;
            _authService = authService;
            _clienteRepository = clienteRepository;
        }

        public async Task<Pedido> CrearPedido(Pedido pedido, IEnumerable<DetallePedido> detallePedido)
        {
            var pedidoCreado = await _pedidoRepository.CrearPedido(pedido);

            foreach (DetallePedido detalle in detallePedido)
            {
                DetallePedido detalleCreado = await _detallePedidoRepository.Crear(detalle);

                // Verificar la cantidad disponible en el lote
                var loteDetalle = detalle.CodigoLote;
                ArticuloLote? loteExistente = await _articuloLoteRepository.GetById(loteDetalle);

                if (loteExistente != null)
                {
                    // Caso 1: La cantidad solicitada es menor que la disponible en el lote
                    if (detalleCreado.Cantidad < loteExistente.AlCantidad)
                    {
                        // No hay faltantes, hay suficiente stock
                        Console.WriteLine($"Stock suficiente. Disponible: {loteExistente.AlCantidad}, Solicitado: {detalleCreado.Cantidad}");
                    }
                    // Caso 2: La cantidad solicitada es igual a la disponible en el lote
                    else if (detalleCreado.Cantidad == loteExistente.AlCantidad)
                    {
                        // No hay faltantes, pero se agota el stock completamente
                        Console.WriteLine($"Stock exacto. Disponible: {loteExistente.AlCantidad}, Solicitado: {detalleCreado.Cantidad}");
                    }
                    // Caso 3: La cantidad solicitada es mayor que la disponible en el lote
                    else
                    {
                        // Hay faltantes, registrar la cantidad que excede lo disponible
                        int cantidadFaltante = (int)(detalleCreado.Cantidad - loteExistente.AlCantidad);

                        var detalleFaltante = new DetallePedidoFaltante
                        {
                            Codigo = 0,
                            DetallePedido = detalleCreado.Codigo,
                            Cantidad = cantidadFaltante,
                            Situacion = 0,
                            Observacion = $"Stock insuficiente. Disponible: {loteExistente.AlCantidad}, Solicitado: {detalleCreado.Cantidad}"
                        };

                        await _detallePedidoFaltanteRepository.Crear(detalleFaltante);
                    }
                }
                else
                {
                    // Este caso no debería ocurrir según los requisitos, pero lo dejamos como protección
                    Console.WriteLine("Error: Lote no encontrado, esto no debería ocurrir según los requisitos");
                }
            }

            return pedidoCreado;
        }


        public async Task<DetallePedidoFaltante> AnularFaltante(uint detallePedidoId)
        {
            Console.WriteLine($"Iniciando AnularFaltante - DetallePedidoId: {detallePedidoId}");
            
            // El parámetro detallePedidoId es el código del detalle del pedido (d_detalle_pedido)
            var detalleFaltanteAAnular = await _detallePedidoFaltanteRepository.GetByPedido(detallePedidoId);
            if (detalleFaltanteAAnular == null)
            {
                Console.WriteLine($"Error: No se encontró faltante para el detalle pedido: {detallePedidoId}");
                throw new Exception("Detalle de faltante no encontrado");
            }
            
            Console.WriteLine($"Faltante encontrado - Código: {detalleFaltanteAAnular.Codigo}, Cantidad actual: {detalleFaltanteAAnular.Cantidad}");
            
            detalleFaltanteAAnular.Cantidad = 0;
            Console.WriteLine($"Cantidad establecida a 0");
            
            var resultado = await _detallePedidoFaltanteRepository.Update(detalleFaltanteAAnular);
            Console.WriteLine($"Update completado - Cantidad final: {resultado.Cantidad}");
            
            return resultado;
        }

        public async Task<string> AnularPedido(uint codigo, string motivo)
        {
            var pedidoAAnular = await _pedidoRepository.GetById(codigo);

            if (pedidoAAnular == null)
            {
                return "Pedido no encontrado";
            }

            if (pedidoAAnular.Estado == 0)
            {
                return "El pedido ya ha sido anulado";
            }

            pedidoAAnular.Estado = 0;

            pedidoAAnular.Observacion = "Pedido anulado";
            await _pedidoRepository.SaveChangesAsync();
            return "Pedido anulado satisfactoriamente";
        }

        public async Task<IEnumerable<PedidoViewModel>> GetPedidos(
        string? fechaDesde,
        string? fechaHasta,
        string? nroPedido,
        int? articulo,
        IEnumerable<int>? clientes,
        string? vendedores,
        string? sucursales,
        string? estado,
        int? moneda,
        string? factura,
        int? limit = null
        )
        {
            var pedidos = await _pedidoRepository.GetPedidos(
                fechaDesde, fechaHasta, nroPedido, articulo,
                clientes, vendedores, sucursales, estado, moneda, factura
            );

            return pedidos;
        }

        public async Task<ResponseViewModel<Pedido>> AutorizarPedido(
            uint idPedido,
            string Usuario,
            string Password
        )
        {
            LoginResponse loginResponse = await _authService.Login(Usuario, Password);
            if (loginResponse == null)
            {
                return new ResponseViewModel<Pedido>
                {
                    Success = false,
                    Message = "Usuario o contraseña incorrectos."
                };
            }
            if (loginResponse.Usuario[0].OpAutorizar != 1)
            {
                return new ResponseViewModel<Pedido>
                {
                    Success = false,
                    Message = "Usuario sin permisos para autorizar un pedido."
                };
            }

            var pedidoAAutorizar = await _pedidoRepository.GetById(idPedido);
            var areaPedidoActual = pedidoAAutorizar.Area;

            if (areaPedidoActual == 3)
            {
                return new ResponseViewModel<Pedido>
                {
                    Success = false,
                    Message = "Pedido en tesoreria, autorice desde el modulo ventas."
                };
            }

            if (areaPedidoActual == 2)
            {
                return new ResponseViewModel<Pedido>
                {
                    Success = false,
                    Message = "Pedido ya se encuentra en el area 'Ventas'"
                };
            }
            var siguienteArea = await _areaSecuenciaRepository.GetSiguienteArea(areaPedidoActual);

            pedidoAAutorizar.Area = siguienteArea;
            await _pedidoRepository.SaveChangesAsync();
            var pedidoEstadoNuevo = new PedidosEstados
            {
                Codigo = 0,
                Pedido = pedidoAAutorizar.Codigo,
                Area = siguienteArea,
                Operador = loginResponse.Usuario[0].OpNombre,
                Fecha = DateTime.Now
            };
            await _pedidoEstadoRepository.Crear(pedidoEstadoNuevo);

            return new ResponseViewModel<Pedido>
            {
                Success = true,
                Message = "Pedido autorizado satisfactoriamente"
            };
        }



        public async Task<DetallePedido?> CambiarLoteDetallePedido(uint idDetallePedido, string lote, uint idLote)
        {
            Console.WriteLine($"Iniciando cambio de lote - ID Detalle: {idDetallePedido}, Lote: {lote}, ID Lote: {idLote}");
            
            var detallePedido = await _detallePedidoRepository.GetById(idDetallePedido);
            if (detallePedido == null)
            {
                Console.WriteLine($"Error: Detalle pedido no encontrado con ID: {idDetallePedido}");
                return null;
            }

            var loteExistente = await _articuloLoteRepository.GetById(idLote);

            if (loteExistente == null)
            {
                Console.WriteLine($"Error: Lote no encontrado con ID: {idLote}");
                return null;
            }
            
            Console.WriteLine($"Detalle pedido encontrado - Lote actual: {detallePedido.Lote ?? "NULL"}, CodigoLote actual: {detallePedido.CodigoLote}");
            
            // Guardar valores anteriores para logging
            var loteAnterior = detallePedido.Lote ?? "NULL";
            var codigoLoteAnterior = detallePedido.CodigoLote;
            
            // Actualizar valores
            detallePedido.Lote = lote;
            detallePedido.CodigoLote = idLote;
            detallePedido.Vencimiento = DateOnly.FromDateTime(loteExistente.AlVencimiento);
            
            Console.WriteLine($"Valores actualizados - Lote: {loteAnterior} -> {detallePedido.Lote}, CodigoLote: {codigoLoteAnterior} -> {detallePedido.CodigoLote}");
            
            try
            {
                var resultado = await _detallePedidoRepository.Update(detallePedido);
                Console.WriteLine($"Update completado exitosamente - Lote final: {resultado.Lote}, CodigoLote final: {resultado.CodigoLote}");
                return resultado;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error durante el update: {ex.Message}");
                throw;
            }
        }

        public async Task<IEnumerable<PedidoViewModel>> GetPedidosPorCliente(string clienteRuc)
        {
            var cliente = await _clienteRepository.GetByRuc(clienteRuc) ?? throw new Exception("Cliente no encontrado");
            var pedidos = await _pedidoRepository.GetPedidos(
                null, // fechaDesde
                null, // fechaHasta
                null, // nroPedido
                null, // articulo
                [(int)cliente.Codigo],
                null,// vendedores
                null, // sucursales,
                null, // estado
                null, //moneda
                null,// factura
                3 // limit
            );
            return pedidos;
        }
    }
}