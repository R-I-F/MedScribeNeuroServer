export interface IGoogleRes{
    success: boolean;
    data:{
        headers: any[],
        data: any[],
        totalRows: number,
        totalColumns: number
    },
    timestamp: any
}