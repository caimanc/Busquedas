import AlgorithmVisualizer from "@/components/algorithm-visualizer"

export default function Home() {
  return (
    // <main className="min-h-screen bg-background">
    //   <div className="container mx-auto px-4 py-10">
    //     <div className="space-y-6">
    //       <div className="text-center space-y-2">
    //         <h1 className="text-4xl font-bold tracking-tight">Visualizador de Algoritmos de Búsqueda</h1>
    //         <p className="text-muted-foreground max-w-2xl mx-auto">
    //           Explora y comprende cómo funcionan los diferentes algoritmos de búsqueda a través de visualizaciones
    //           interactivas.
    //         </p>
    //       </div>

    //       <Tabs defaultValue="internal" className="w-full">
    //         <div className="flex justify-center mb-6">
    //           <TabsList>
    //             <TabsTrigger value="internal">Búsqueda Interna</TabsTrigger>
    //             <TabsTrigger value="external">Búsqueda Externa</TabsTrigger>
    //           </TabsList>
    //         </div>

    //         <TabsContent value="internal" className="space-y-8">
    //           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //             <Card>
    //               <CardHeader>
    //                 <CardTitle>Búsqueda Lineal</CardTitle>
    //                 <CardDescription>
    //                   Recorre secuencialmente cada elemento hasta encontrar el valor buscado.
    //                 </CardDescription>
    //               </CardHeader>
    //               <CardContent>
    //                 <AlgorithmVisualizer algorithm="linear" />
    //               </CardContent>
    //             </Card>

    //             <Card>
    //               <CardHeader>
    //                 <CardTitle>Búsqueda Binaria</CardTitle>
    //                 <CardDescription>
    //                   Divide repetidamente a la mitad el espacio de búsqueda para encontrar el valor.
    //                 </CardDescription>
    //               </CardHeader>
    //               <CardContent>
    //                 <AlgorithmVisualizer algorithm="binary" />
    //               </CardContent>
    //             </Card>
    //           </div>
    //         </TabsContent>

    //         <TabsContent value="external" className="space-y-8">
    //           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //             <Card>
    //               <CardHeader>
    //                 <CardTitle>Árbol B</CardTitle>
    //                 <CardDescription>
    //                   Estructura de datos en árbol que mantiene los datos ordenados y permite búsquedas.
    //                 </CardDescription>
    //               </CardHeader>
    //               <CardContent>
    //                 <AlgorithmVisualizer algorithm="btree" />
    //               </CardContent>
    //             </Card>

    //             <Card>
    //               <CardHeader>
    //                 <CardTitle>Árbol B+</CardTitle>
    //                 <CardDescription>Variante del árbol B que mantiene todos los datos en las hojas.</CardDescription>
    //               </CardHeader>
    //               <CardContent>
    //                 <AlgorithmVisualizer algorithm="bplustree" />
    //               </CardContent>
    //             </Card>
    //           </div>
    //         </TabsContent>
    //       </Tabs>
    //     </div>
    //   </div>
    // </main>
    <div className="min-h-screen bg-marfil text-carbon">
      <AlgorithmVisualizer />
    </div>
  )
}
